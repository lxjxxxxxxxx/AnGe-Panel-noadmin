package openness

import (
	"strconv"
	"sun-panel/api/api_v1/common/apiReturn"
	"sun-panel/api/api_v1/common/base"
	"sun-panel/global"
	"sun-panel/lib/cmn"
	"sun-panel/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserAccessTokenOpen struct{}

type LoginByAccessTokenReq struct {
	AccessToken string `json:"accessToken" validate:"required"`
}

func (a *UserAccessTokenOpen) LoginByAccessToken(c *gin.Context) {
	req := LoginByAccessTokenReq{}
	if err := c.ShouldBindBodyWith(&req, binding.JSON); err != nil {
		apiReturn.ErrorParamFomat(c, err.Error())
		return
	}
	if errMsg, err := base.ValidateInputStruct(req); err != nil {
		apiReturn.ErrorParamFomat(c, errMsg)
		return
	}

	hash := cmn.Sha256(req.AccessToken)
	m := models.UserAccessToken{}
	record, err := m.GetByTokenHash(hash)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			apiReturn.ErrorByCode(c, 1003)
			return
		}
		apiReturn.ErrorDatabase(c, err.Error())
		return
	}

	// Update last used time
	record.LastUsedAt = time.Now()
	models.Db.Model(&record).Where("id=?", record.ID).Update("last_used_at", record.LastUsedAt)

	// Get user info
	mUser := models.User{}
	userInfo, err := mUser.GetUserInfoByUid(record.UserId)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			apiReturn.ErrorByCode(c, 1006)
			return
		}
		apiReturn.ErrorDatabase(c, err.Error())
		return
	}

	if userInfo.Status != 1 {
		apiReturn.ErrorByCode(c, 1004)
		return
	}

	// Generate session token (same as normal login)
	bToken := userInfo.Token
	if userInfo.Token == "" {
		buildTokenOver := false
		for !buildTokenOver {
			bToken = cmn.BuildRandCode(32, cmn.RAND_CODE_MODE2)
			if _, err := mUser.GetUserInfoByToken(bToken); err != nil {
				mUser.UpdateUserInfoByUserId(userInfo.ID, map[string]interface{}{
					"token": bToken,
				})
				buildTokenOver = true
			}
		}
		userInfo.Token = bToken
	}
	userInfo.Password = ""
	userInfo.ReferralCode = ""

	cToken := uuid.NewString() + "-" + cmn.Md5(cmn.Md5("userId" + strconv.Itoa(int(userInfo.ID))))
	global.CUserToken.SetDefault(cToken, bToken)

	c.Set("userInfo", userInfo)
	userInfo.Token = cToken
	apiReturn.SuccessData(c, userInfo)
}
