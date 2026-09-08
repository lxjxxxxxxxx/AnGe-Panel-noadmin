declare namespace Login{

    interface LoginReqest{
        username:string 
        password:string
        vcode?:string
    }

	interface LoginResponse extends User.Info{
		token :string
	}

    interface ResetPasswordByVCodeReqest extends System.Register.SendRegisterVcodeRquest{
    }

    interface TokenLoginRequest {
        accessToken: string
    }

    interface AccessTokenItem {
        id: number
        userId: number
        name: string
        createTime: string
        updateTime: string
        lastUsedAt: string
    }

    interface AccessTokenCreateResponse {
        id: number
        name: string
        token: string
    }

    interface AccessTokenListResponse {
        list: AccessTokenItem[]
    }

}