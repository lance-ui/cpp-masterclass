import { useEffect } from "react";

const SITE = "C++ MasterClass";
const DEFAULT_DESC =
  "Learn C++ by writing and running real code. 27 modules, quizzes, and a real g++ (C++20) sandbox with an interactive console.";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/terms", "/privacy"]);

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function DocumentMeta({ pathname }: { pathname: string }) {
  useEffect(() => {
    const normalized = pathname.replace(/\/+$/, "") || "/";
    const isPublic = PUBLIC_PATHS.has(normalized);
    const origin = window.location.origin;

    let title = SITE;
    let description = DEFAULT_DESC;
    if (normalized === "/login") {
      title = `Sign in · ${SITE}`;
      description = "Sign in with Google to continue learning on C++ MasterClass.";
    } else if (normalized === "/signup") {
      title = `Create account · ${SITE}`;
      description =
        "Create your C++ MasterClass account with Google to start learning.";
    } else if (normalized === "/terms") {
      title = `Terms · ${SITE}`;
    } else if (normalized === "/privacy") {
      title = `Privacy · ${SITE}`;
    } else if (!isPublic) {
      title = `${SITE}`;
    }

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", isPublic ? "index,follow" : "noindex,nofollow");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", `${origin}${normalized}`);
    upsertMeta("property", "og:image", `${origin}/og.svg`);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", `${origin}/og.svg`);
    upsertLink("canonical", `${origin}${normalized === "/" ? "/" : normalized}`);
  }, [pathname]);

  return null;
}
