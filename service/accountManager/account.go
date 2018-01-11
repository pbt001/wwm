package accountManager

import (
	"context"

	"github.com/iryonetwork/wwm/gen/models"
)

// Service describes actions supported by the accountManager service
type Service interface {
	Users(context.Context, string) ([]*models.User, error)
	User(context.Context, string) (*models.User, error)
	AddUser(context.Context, *models.User) (*models.User, error)
	UpdateUser(context.Context, *models.User) (*models.User, error)
	RemoveUser(context.Context, string) error
}

// Storage describes methods required from the storage used by the service
type Storage interface {
	GetUsers() ([]*models.User, error)
	GetUser(string) (*models.User, error)
	AddUser(*models.User) (*models.User, error)
	UpdateUser(*models.User) (*models.User, error)
	RemoveUser(string) error
}

type accountManager struct {
	storage Storage
}
