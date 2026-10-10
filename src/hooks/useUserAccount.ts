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

  const signOutMutation = useMutation({
    mutationFn: async () => {
      return await userAccountService.signOut()
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
    isSubmittingSignIn: signInMutation.isPending,
    isSuccessSignIn: signInMutation.isSuccess,
    isErrorSignIn: signInMutation.isError,
    signInError: signInMutation.error,
    signOut: signOutMutation.mutate,
    signOutAsync: signOutMutation.mutateAsync,
    isSubmittingSignOut: signOutMutation.isPending,
    isSuccessSignOut: signOutMutation.isSuccess,
    isErrorSignOut: signOutMutation.isError,
    signOutError: signOutMutation.error,
    getAccessToken: () => userAccountService.getAccessToken(),
    getSession: () => userAccountService.getSession(),
    getUser: () => userAccountService.getUser(),
  }

}

export { useUserAccount };