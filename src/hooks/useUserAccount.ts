import { useMutation } from "@tanstack/react-query"
import { userAccountService } from "../services/userAccountService"
import type { UserRegistration } from "../type/userRegistration";
import type { UserLogin } from "@/type/userLogin";

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

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: UserLogin) => {
      return await userAccountService.signIn({
        email,
        password,
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
    signUpError: signUpMutation.error,
    signIn: signInMutation.mutate,
    signInAsync: signInMutation.mutateAsync,
    isSubmittingSignIn: signInMutation.isPending,
    isSuccessSignIn: signInMutation.isSuccess,
    isErrorSignIn: signInMutation.isError,
    signInError: signInMutation.error,
  }

}

export { useUserAccount };