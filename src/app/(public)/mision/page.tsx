"use client";

import { useEffect } from "react";

export default function MisionRedirect() {
  useEffect(() => {
    window.location.replace("/#mision");
  }, []);

  return null;
}
