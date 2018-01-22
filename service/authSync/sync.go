package authSync

import (
	"crypto/ecdsa"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/iryonetwork/wwm/service/authenticator"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/acme"
)

type authSync struct {
	storage Storage
	pk      *ecdsa.PrivateKey
	url     string
	log     *log.Entry
}

// Service describes actions supported by the authSync service
type Service interface {
	Sync() error
}

// Storage describes methods required from the storage used by the service
type Storage interface {
	GetChecksum() ([]byte, error)
	WriteTo(writer io.Writer) (int64, error)
	ReplaceDB(src io.ReadCloser, checksum []byte) error
}

func (a *authSync) Sync() error {
	currentChecksum, err := a.storage.GetChecksum()
	if err != nil {
		return err
	}
	currentEtag := base64.RawURLEncoding.EncodeToString(currentChecksum)
	a.log.WithField("currentDBEtag", currentEtag).Info("Starting DB sync with cloud")

	token, err := a.createToken()
	if err != nil {
		fmt.Println(err)
		return err
	}

	request, err := http.NewRequest(http.MethodGet, a.url, nil)
	request.Header.Add("etag", `"`+currentEtag+`"`)
	request.Header.Add("token", token)

	netClient := &http.Client{
		Timeout: time.Second * 10,
	}
	response, err := netClient.Do(request)
	if err != nil {
		return err
	}

	if response.StatusCode == http.StatusOK {
		cloudEtag := strings.Trim(response.Header.Get("etag"), `"`)
		a.log.WithField("cloudDBEtag", cloudEtag).Info("Got new BD from cloud")
		checksum, err := base64.RawURLEncoding.DecodeString(cloudEtag)
		if err != nil {
			return err
		}

		return a.storage.ReplaceDB(response.Body, checksum)
	}

	if response.StatusCode != http.StatusNotModified {
		body, err := ioutil.ReadAll(response.Body)
		if err != nil {
			return err
		}
		return fmt.Errorf("Error fetching databse: %s", string(body))
	}

	a.log.Info("Local BD is in correct state")

	return nil
}

var tokenExpiersIn = time.Duration(15) * time.Minute

func (a *authSync) createToken() (string, error) {
	thumb, err := acme.JWKThumbprint(a.pk.Public())
	if err != nil {
		return "", err
	}

	claims := &authenticator.Claims{
		KeyID: thumb,
		StandardClaims: jwt.StandardClaims{
			IssuedAt:  time.Now().Unix(),
			ExpiresAt: time.Now().Add(tokenExpiersIn).Unix(),
		},
	}

	// create the token
	return jwt.NewWithClaims(jwt.SigningMethodES256, claims).SignedString(a.pk)
}

// New returns new service
func New(log *log.Entry, storage Storage, certFile, keyFile, url string) (Service, error) {
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return nil, err
	}

	pk, ok := cert.PrivateKey.(*ecdsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("Certificate doesn't contain ECDSA key")
	}

	return &authSync{
		storage: storage,
		pk:      pk,
		url:     url,
		log:     log,
	}, nil
}