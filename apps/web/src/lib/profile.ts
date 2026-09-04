export type ProfileLinkItem = {
  key: string;
  link: string | null;
};

export type ProfileDetail = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  email: string | null;
  pn: string | null;
  residence: string | null;
  education: string | null;
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
  education?: string | null;
  links: ProfileLinkItem[];
};

export function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function formatLinksCell(links: ProfileLinkItem[]) {
  if (links.length === 0) return "";
  return links.map((item) => item.key).join(", ");
}
