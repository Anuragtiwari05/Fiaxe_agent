const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type SignupData = {
  name: string;
  email: string;
  password: string;
};

type LoginData = {
  email: string;
  password: string;
};

function parseErrorMessage(result: any, fallback: string) {
  return (
    result?.error ||
    result?.message ||
    fallback
  );
}

export async function signupUser(data: SignupData) {
  

  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  

  if (!res.ok) {
    throw new Error(parseErrorMessage(result, "Signup failed"));
  }

  return result;
}

export async function loginUser(data: LoginData) {
  console.log("BASE_URL:", BASE_URL);
  console.log("Login payload:", data);

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  console.log("Login status:", res.status);
  console.log("Login result:", result);

  if (!res.ok) {
    throw new Error(parseErrorMessage(result, "Login failed"));
  }

  return result;
}

export async function sendVoice(formData: FormData, token?: string) {
  console.log("BASE_URL:", BASE_URL);
  console.log("Sending voice request...");

  const res = await fetch(`${BASE_URL}/api/ai/voice`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  const result = await res.json();

  console.log("Voice status:", res.status);
  console.log("Voice result:", result);

  if (!res.ok) {
    throw new Error(parseErrorMessage(result, "Voice request failed"));
  }

  return result;
}