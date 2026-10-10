import { supabase } from "./supabaseClient";
import type { UserLogin } from "../type/userLogin.ts";
import type { UserRegistration } from "../type/userRegistration";

class UserAccountService {

  async signUp({ email, password, name }: UserRegistration) {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name
        },
        emailRedirectTo: import.meta.env.VITE_SIGN_UP_REDIRECT_URL
      }
    })

    if (error) throw error
    return data
  }

  async signIn({ email, password }: UserLogin) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) throw error
    return data
  }

}

export const userAccountService = new UserAccountService();
