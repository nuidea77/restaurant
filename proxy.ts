import { NextResponse } from "next/server";
import { auth } from "@/auth";

// /dashboard-г нэвтрээгүй хэрэглэгчээс хамгаална.
export const proxy = auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
