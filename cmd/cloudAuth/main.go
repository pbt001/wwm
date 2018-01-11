package main

//go:generate sh -c "mkdir -p ../../gen && swagger generate server -A cloudAuth -t ../../gen -f ../../docs/api/auth.yml --exclude-main --principal models.User"

import (
	"log"

	loads "github.com/go-openapi/loads"

	"github.com/iryonetwork/wwm/gen/restapi"
	"github.com/iryonetwork/wwm/gen/restapi/operations"
	"github.com/iryonetwork/wwm/service/authenticator"
	"github.com/iryonetwork/wwm/storage/auth"
)

func main() {
	swaggerSpec, err := loads.Analyzed(restapi.SwaggerJSON, "")
	if err != nil {
		log.Fatalln(err)
	}

	// initialize storage
	storage, err := auth.New("/tmp/auth.db")
	if err != nil {
		log.Fatalln(err)
	}

	// initialize the service
	auth := authenticator.New(storage)

	api := operations.NewCloudAuthAPI(swaggerSpec)
	server := restapi.NewServer(api)
	server.Port = 80
	server.EnabledListeners = []string{"http"}
	defer server.Shutdown()

	api.TokenAuth = auth.GetUserFromToken
	api.AuthGetRenewHandler = getRenew(auth)
	api.AuthPostLoginHandler = postLogin(auth)
	api.AuthPostValidateHandler = postValidateHandler(auth)

	server.SetHandler(api.Serve(nil))

	if err := server.Serve(); err != nil {
		log.Fatalln(err)
	}

}
