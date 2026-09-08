package panel

import (
	"crypto/sha256"
	"encoding/hex"
	"sun-panel/api/api_v1/common/apiReturn"
	"sun-panel/api/api_v1/common/base"
	"sun-panel/lib/cmn"
	"sun-panel/models"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

type UserAccessToken struct{}

type CreateAccessTokenReq struct {
	Name string `json:"name" validate:"required,max=50"`
}

type DeleteAccessTokenReq struct {
	Id uint `json:"id" validate:"required"`
}

func tokenHash(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func (a *UserAccessToken) Create(c *gin.Context) {
	userInfo, _ := base.GetCurrentUserInfo(c)

	req := CreateAccessTokenReq{}
	if err := c.ShouldBindBodyWith(&req, binding.JSON); err != nil {
		apiReturn.ErrorParamFomat(c, err.Error())
		return
	}
	if errMsg, err := base.ValidateInputStruct(req); err != nil {
		apiReturn.ErrorParamFomat(c, errMsg)
		return
	}

	rawToken := cmn.BuildRandCode(40, cmn.RAND_CODE_MODE2)
	hash := tokenHash(rawToken)

	record := models.UserAccessToken{
		UserId:    userInfo.ID,
		Name:      req.Name,
		TokenHash: hash,
	}
	if _, err := record.CreateOne(); err != nil {
		apiReturn.ErrorDatabase(c, err.Error())
		return
	}

	record.TokenHash = ""
	apiReturn.SuccessData(c, gin.H{
		"id":    record.ID,
		"name":  record.Name,
		"token": rawToken,
	})
}

func (a *UserAccessToken) GetList(c *gin.Context) {
	userInfo, _ := base.GetCurrentUserInfo(c)

	m := models.UserAccessToken{}
	list, err := m.GetListByUserId(userInfo.ID)
	if err != nil {
		apiReturn.ErrorDatabase(c, err.Error())
		return
	}

	apiReturn.SuccessData(c, gin.H{
		"list": list,
	})
}

func (a *UserAccessToken) Deletes(c *gin.Context) {
	userInfo, _ := base.GetCurrentUserInfo(c)

	req := DeleteAccessTokenReq{}
	if err := c.ShouldBindBodyWith(&req, binding.JSON); err != nil {
		apiReturn.ErrorParamFomat(c, err.Error())
		return
	}

	m := models.UserAccessToken{}
	if err := m.DeleteByIdAndUserId(req.Id, userInfo.ID); err != nil {
		apiReturn.ErrorDatabase(c, err.Error())
		return
	}

	apiReturn.Success(c)
}

func (a *UserAccessToken) GetListByAdmin(c *gin.Context) {
	m := models.UserAccessToken{}
	list, err := m.GetListByUserId(0)
	if err != nil {
		apiReturn.ErrorDatabase(c, err.Error())
		return
	}

	// Build a map of userId -> username for display
	userIdMap := map[uint]string{}
	var allUsers []models.User
	models.Db.Find(&allUsers)
	for _, u := range allUsers {
		userIdMap[u.ID] = u.Username
	}

	type Item struct {
		models.UserAccessToken
		Username string `json:"username"`
	}
	items := []Item{}
	for _, t := range list {
		username := userIdMap[t.UserId]
		items = append(items, Item{t, username})
	}

	apiReturn.SuccessData(c, gin.H{
		"list": items,
	})
}


