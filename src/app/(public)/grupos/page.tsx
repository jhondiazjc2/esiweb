"use client";

import { useEffect } from "react";

export default function GruposRedirect() {
  useEffect(() => {
    window.location.replace("/#grupos");
  }, []);

  return null;
}
