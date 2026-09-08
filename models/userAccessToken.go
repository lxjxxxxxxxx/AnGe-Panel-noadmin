package models

import "time"

type UserAccessToken struct {
	BaseModel
	UserId     uint      `gorm:"index" json:"userId"`
	Name       string    `gorm:"type:varchar(50)" json:"name"`
	TokenHash  string    `gorm:"type:varchar(64);uniqueIndex" json:"-"`
	LastUsedAt time.Time `json:"lastUsedAt"`
}

func (m *UserAccessToken) GetListByUserId(userId uint) ([]UserAccessToken, error) {
	var list []UserAccessToken
	err := Db.Where("user_id=?", userId).Order("id desc").Find(&list).Error
	return list, err
}

func (m *UserAccessToken) GetByTokenHash(hash string) (UserAccessToken, error) {
	var token UserAccessToken
	err := Db.Where("token_hash=?", hash).First(&token).Error
	return token, err
}

func (m *UserAccessToken) CreateOne() (UserAccessToken, error) {
	err := Db.Create(m).Error
	return *m, err
}

func (m *UserAccessToken) DeleteByIdAndUserId(id, userId uint) error {
	return Db.Where("id=? AND user_id=?", id, userId).Delete(m).Error
}
