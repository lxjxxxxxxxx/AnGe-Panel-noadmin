package panel

import (
	"sun-panel/api/api_v1"
	"sun-panel/api/api_v1/middleware"

	"github.com/gin-gonic/gin"
)

func InitUserAccessToken(router *gin.RouterGroup) {
	api := api_v1.ApiGroupApp.ApiPanel.UserAccessToken
	r := router.Group("", middleware.LoginInterceptor)
	{
		r.POST("/panel/userAccessToken/create", api.Create)
		r.POST("/panel/userAccessToken/getList", api.GetList)
		r.POST("/panel/userAccessToken/deletes", api.Deletes)
	}
}
