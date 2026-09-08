package openness

import (
	"sun-panel/api/api_v1"

	"github.com/gin-gonic/gin"
)

func InitUserAccessToken(router *gin.RouterGroup) {
	api := api_v1.ApiGroupApp.ApiOpen.UserAccessToken
	router.POST("loginByAccessToken", api.LoginByAccessToken)
}
