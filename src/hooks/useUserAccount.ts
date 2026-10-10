import { useMutation } from "@tanstack/react-query"
import { userAccountService } from "../services/userAccountService"
import type { UserRegistration } from "../type/userRegistration";

function useUserAccount() {
  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, name: fullName }: UserRegistration) => {
      return await userAccountService.signUp({
        email,
        password,
        name: fullName,
      })
    },
    onSuccess: (data) => {
      return data
    },
    onError: (error) => {
      return error
    }
  })

  return {
    signUp: signUpMutation.mutate,
    isSubmittingSignUp: signUpMutation.isPending,
    isSuccessSignUp: signUpMutation.isSuccess,
    isErrorSignUp: signUpMutation.isError,
    signUpError: signUpMutation.error
  }

}

export { useUserAccount };