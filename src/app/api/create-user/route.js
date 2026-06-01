import { NextResponse } from "next/server";
import { createAuthUser, createUserProfile } from "@/lib/db/auth-admin";

export async function POST(request) {
  const { full_name, email, password, role, position, sector_id, unit_id } =
    await request.json();

  const { data, error } = await createAuthUser(email, password);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  const { error: profileError } = await createUserProfile(
    data.user.id,
    full_name,
    email,
    role,
    position,
    sector_id,
    unit_id,
  );

  if (profileError) {
    return NextResponse.json(
      { error: "Usuário criado mas perfil falhou: " + profileError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
