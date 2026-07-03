"use client";

import { useEffect } from "react";

export default function ContactoRedirect() {
  useEffect(() => {
    window.location.replace("/#contacto");
  }, []);

  return null;
}
