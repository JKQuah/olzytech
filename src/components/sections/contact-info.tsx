import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { siteConfig } from "@/config/site";
import type { Dictionary } from "@/i18n/dictionaries";

export function ContactInfo({ dict }: { dict: Dictionary["contact"]["info"] }) {
  const rows = [
    { icon: Mail, label: dict.email, value: siteConfig.email, href: `mailto:${siteConfig.email}` },
    { icon: Phone, label: dict.phone, value: siteConfig.phone, href: `tel:${siteConfig.phoneE164}` },
    { icon: Clock, label: dict.hours, value: dict.hoursValue },
    { icon: MapPin, label: dict.location, value: dict.locationValue },
  ];

  return (
    <Reveal delay={100} className="flex flex-col gap-8">
      <div className="glass rounded-3xl p-7">
        <h2 className="text-lg font-semibold tracking-tight">{dict.title}</h2>
        <ul className="mt-6 flex flex-col gap-5">
          {rows.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex items-start gap-4">
              <span className="bg-brand grid size-10 shrink-0 place-items-center rounded-xl">
                <Icon className="size-4 text-white" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">{label}</p>
                {href ? (
                  <a href={href} className="text-sm font-medium text-white hover:underline">{value}</a>
                ) : (
                  <p className="text-sm font-medium text-white">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass rounded-3xl p-7">
        <h2 className="text-lg font-semibold tracking-tight">{dict.responseTitle}</h2>
        <ol className="mt-5 flex flex-col gap-4">
          {dict.steps.map((step, i) => (
            <li key={step} className="flex gap-4 text-sm text-white/80">
              <span className="text-brand font-semibold">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
