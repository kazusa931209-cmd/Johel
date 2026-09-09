export type ProfileLinkItem = {
  key: string;
  link: string | null;
};

export type ProfileGraduation = {
  year: number;
  month: number;
};

export type ProfileDetail = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  email: string | null;
  pn: string | null;
  residence: string | null;
  university: string | null;
  graduationYear: number | null;
  graduationMonth: number | null;
  degree: string | null;
  links: ProfileLinkItem[];
  createdAt: string;
  updatedAt: string;
};

export type ProfileWritePayload = {
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  email?: string | null;
  pn?: string | null;
  residence?: string | null;
  university?: string | null;
  graduationYear: number;
  graduationMonth: number;
  degree?: string | null;
  links: ProfileLinkItem[];
};

export function resolveProfileGraduation(
  profile:
    | {
        graduationYear: number | null;
        graduationMonth: number | null;
      }
    | undefined
    | null,
): ProfileGraduation | null {
  if (
    profile?.graduationYear == null ||
    profile?.graduationMonth == null
  ) {
    return null;
  }
  return {
    year: profile.graduationYear,
    month: profile.graduationMonth,
  };
}

export function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function formatLinksCell(links: ProfileLinkItem[]) {
  if (links.length === 0) return "";
  return links.map((item) => item.key).join(", ");
}

export function formatEducationCell(
  profile: {
    university: string | null;
    graduationYear: number | null;
    graduationMonth: number | null;
    degree: string | null;
  },
  locale = "en",
) {
  const graduationLabel =
    profile.graduationYear != null && profile.graduationMonth != null
      ? new Intl.DateTimeFormat(locale, {
          month: "short",
          year: "numeric",
        }).format(
          new Date(
            profile.graduationYear,
            profile.graduationMonth - 1,
            1,
          ),
        )
      : profile.graduationYear != null
        ? String(profile.graduationYear)
        : null;

  const parts = [
    profile.university?.trim(),
    graduationLabel,
    profile.degree?.trim(),
  ].filter(Boolean);
  return parts.join(" · ");
}
