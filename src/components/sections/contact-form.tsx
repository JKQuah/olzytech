"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { privacyPolicy } from "@/content/legal";
import { submitContact, type ContactField, type ContactState } from "@/app/[lang]/contact/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

const initialState: ContactState = { status: "idle" };

/** Dropdown list for the selects: opaque dark panel with a themed hairline, same look as the language menu. */
const selectMenuClass =
  "rounded-2xl! border border-brand-mid/50 bg-popover p-1.5 text-white shadow-[0_24px_60px_-18px_rgb(var(--to-rgb)/0.5)] ring-0";

const fieldClass =
  "h-11 rounded-xl border-white/15 bg-black px-4 text-base text-white placeholder:text-[#808081] focus-visible:border-brand-mid/70 md:text-sm";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-destructive mt-1.5 text-xs">
      {message}
    </p>
  );
}

export function ContactForm({ locale, dict }: { locale: Locale; dict: Dictionary["contact"]["form"] }) {
  const [state, formAction, pending] = useActionState(submitContact, initialState);

  if (state.status === "success") {
    return (
      <div role="status" className="glass flex flex-col items-center gap-4 rounded-3xl px-8 py-16 text-center">
        <CheckCircle2 className="size-12 text-brand-from" />
        <h2 className="text-2xl font-semibold tracking-tight">{dict.successTitle}</h2>
        <p className="text-muted-foreground max-w-sm text-sm">{dict.successBody}</p>
      </div>
    );
  }

  const errors = new Set<ContactField>(state.fieldErrors);
  const message = (field: ContactField) => (errors.has(field) ? dict.errors[field] : undefined);
  const v = state.values ?? {};

  return (
    <form action={formAction} noValidate className="glass flex flex-col gap-5 rounded-3xl p-6 md:p-8">
      <input type="hidden" name="locale" value={locale} />
      {/* honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="mb-2">{dict.name}</Label>
          <Input
            id="name" name="name" autoComplete="name" required defaultValue={v.name}
            placeholder={dict.namePlaceholder} aria-invalid={errors.has("name")}
            aria-describedby="name-error" className={fieldClass}
          />
          <FieldError id="name-error" message={message("name")} />
        </div>
        <div>
          <Label htmlFor="email" className="mb-2">{dict.email}</Label>
          <Input
            id="email" name="email" type="email" autoComplete="email" required defaultValue={v.email}
            placeholder={dict.emailPlaceholder} aria-invalid={errors.has("email")}
            aria-describedby="email-error" className={fieldClass}
          />
          <FieldError id="email-error" message={message("email")} />
        </div>
      </div>

      <div>
        <Label htmlFor="company" className="mb-2">{dict.company}</Label>
        <Input
          id="company" name="company" autoComplete="organization" defaultValue={v.company}
          placeholder={dict.companyPlaceholder} className={fieldClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="service" className="mb-2">{dict.service}</Label>
          <Select name="service" defaultValue={v.service}>
            <SelectTrigger id="service" aria-invalid={errors.has("service")} aria-describedby="service-error" className={cn(fieldClass, "w-full")}>
              <SelectValue placeholder={dict.choose} />
            </SelectTrigger>
            <SelectContent
              // Open BELOW the field (popper) instead of covering it (item-aligned default).
              position="popper"
              align="start"
              sideOffset={8}
              collisionPadding={16}
              className={selectMenuClass}
            >
              {Object.entries(dict.serviceOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="service-error" message={message("service")} />
        </div>
        <div>
          <Label htmlFor="budget" className="mb-2">{dict.budget}</Label>
          <Select name="budget" defaultValue={v.budget}>
            <SelectTrigger id="budget" className={cn(fieldClass, "w-full")}>
              <SelectValue placeholder={dict.choose} />
            </SelectTrigger>
            <SelectContent
              // Open BELOW the field (popper) instead of covering it (item-aligned default).
              position="popper"
              align="start"
              sideOffset={8}
              collisionPadding={16}
              className={selectMenuClass}
            >
              {Object.entries(dict.budgetOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="message" className="mb-2">{dict.message}</Label>
        <Textarea
          id="message" name="message" required rows={6} defaultValue={v.message}
          placeholder={dict.messagePlaceholder} aria-invalid={errors.has("message")}
          aria-describedby="message-error"
          className="min-h-36 rounded-xl border-white/15 bg-black px-4 py-3 text-base text-white placeholder:text-[#808081] focus-visible:border-brand-mid/70 md:text-sm"
        />
        <FieldError id="message-error" message={message("message")} />
      </div>

      {state.status === "error" && !state.fieldErrors?.length && (
        <p role="alert" className="text-destructive text-sm">{dict.errorGeneric}</p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
          {dict.consent}{" "}
          <Link href={privacyPolicy.path} lang="en" hrefLang="en" prefetch={false} className="text-brand-from underline underline-offset-4">
            {privacyPolicy.title}
          </Link>
        </p>
        <Button type="submit" variant="brand" size="pill" disabled={pending} className="h-12 px-7">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? dict.submitting : dict.submit}
        </Button>
      </div>
    </form>
  );
}
