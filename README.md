Iryo for Walk With Me
=====================

This project holds Iryo's first pilot project developed together with Walk With
Me foundation.

## Requirements

* docker
* docker-compose
* go (1.9+) (`brew install golang`)
* govendor (`go get -u github.com/kardianos/govendor`)
* gomock (`go get -u github.com/golang/mock/gomock`, `github.com/golang/mock/mockgen`)
* updated `/etc/hosts` (`127.0.0.1 iryo.local minio.iryo.local vault.iryo.local iryo.cloud minio.iryo.cloud`)

## How to set up and work with the repository

```bash
# clone the repository
mkdir -p $GOPATH/src/github.com/iryo
cd $GOPATH/src/github.com/iryo
git clone git@gitlab.3fs.si:iryo/wwm.git
cd wwm

# prepare the repository (sync vendor folder, etc.)
make

# run tests
make test

# start everything up
make up
```

## Additional documentation

 * [WOW](docs/wow.md)
 * [Secure communication (TLS)](docs/tls.md)
 * [Development environment setup](docs/dev.md)

## Trubleshooting

### Slow resolving of `*.iryo.local` domain

On OSX it's common to experience 5 second timeouts when using `curl` to request a page from `.local` domains. This occurs when OSX internally tries to resolve `iryo.local` with `IPV6`. To fix it, duplicate the line in `/etc/hosts` for all `.local` domains and replace `127.0.0.1` with `::FFFF:10.99.99.99`.

```
::FFFF:10.99.99.99	iryo.local minio.iryo.local vault.iryo.local
```