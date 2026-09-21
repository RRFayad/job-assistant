// PROTOTYPE ONLY — brief read-only review step shown once, right after an
// upload is parsed, before the candidate lands in the permanent edit view.

import { ArrowLeftIcon, PencilIcon, SparklesIcon } from "lucide-react";

import { PageHeader } from "@/components/subscribed/page-header";
import { Button } from "@/components/ui/button";
import { cn, tw } from "@/lib/utils";

import { mockHeader, mockResumeFileName, mockSections } from "./mock-data";
import { renderMarkdownLite } from "./rich-text-field";

type ProfileReviewScreenProps = {
  onBack: () => void;
  onConfirm: () => void;
};

const styles = {
  page: tw("mx-auto w-full max-w-4xl space-y-5"),
  callout: tw(
    "flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-400/30 dark:bg-amber-400/10",
  ),
  calloutIcon: tw("mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"),
  section: tw("rounded-xl border bg-card p-5 shadow-sm"),
  sectionHeader: tw("flex items-center justify-between"),
  sectionTitle: tw("text-sm font-semibold"),
  editButton: tw("text-muted-foreground hover:text-foreground"),
  entry: tw("mt-4 space-y-1 border-l-2 pl-3 first:mt-3"),
  entryTitle: tw("text-sm font-medium"),
  entryMeta: tw("text-xs text-muted-foreground"),
  tagRow: tw("mt-3 flex flex-wrap gap-2"),
  tag: tw("rounded-full bg-muted px-3 py-1 text-xs"),
  bodyText: tw("mt-3 text-sm whitespace-pre-line text-muted-foreground"),
  contactLine: tw("mt-3 text-sm text-muted-foreground"),
  skillGroup: tw("mt-3 first:mt-0"),
  skillGroupLabel: tw("text-xs font-medium text-muted-foreground"),
  navRow: tw("flex items-center justify-between"),
};

export const ProfileReviewScreen = ({
  onBack,
  onConfirm,
}: ProfileReviewScreenProps) => {
  return (
    <div className={styles.page}>
      <PageHeader
        description="Quick check before this becomes your Profile."
        title="Review what we found"
      />

      <div className={styles.callout}>
        <SparklesIcon className={styles.calloutIcon} />
        <p>
          We extracted this from <strong>{mockResumeFileName}</strong>. This is
          what every tailored resume and cover letter will be grounded in — fix
          anything that&apos;s off before continuing.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Header</h2>
          <PencilIcon className={cn(styles.editButton, "size-3.5")} />
        </div>
        <p className={styles.entryTitle}>
          {mockHeader.fullName} — {mockHeader.careerTitle}
        </p>
        <p className={styles.contactLine}>
          {mockHeader.email} · {mockHeader.phone} · {mockHeader.location}
        </p>
        <div className={styles.tagRow}>
          {mockHeader.links.map((link) => (
            <span className={styles.tag} key={link.id}>
              {link.label}
            </span>
          ))}
        </div>
      </div>

      {mockSections.map((section) => (
        <div className={styles.section} key={section.id}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <PencilIcon className={cn(styles.editButton, "size-3.5")} />
          </div>

          {section.type === "text" && (
            <div
              className={styles.bodyText}
              dangerouslySetInnerHTML={{
                __html: renderMarkdownLite(section.body),
              }}
            />
          )}

          {section.type === "tags" &&
            section.categories.map((category) => (
              <div className={styles.skillGroup} key={category.id}>
                <p className={styles.skillGroupLabel}>{category.label}</p>
                <div className={styles.tagRow}>
                  {category.items.map((item) => (
                    <span className={styles.tag} key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}

          {section.type === "entries" &&
            section.entries.map((entry) => (
              <div className={styles.entry} key={entry.id}>
                <p className={styles.entryTitle}>{entry.heading}</p>
                <p className={styles.entryMeta}>{entry.dates}</p>
                {entry.body && (
                  <div
                    className={styles.bodyText}
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownLite(entry.body),
                    }}
                  />
                )}
              </div>
            ))}

          {section.type === "list" && (
            <div className="mt-3 space-y-3">
              {section.items.map((item, index) => (
                <div
                  className={styles.bodyText}
                  key={index}
                  dangerouslySetInnerHTML={{ __html: renderMarkdownLite(item) }}
                />
              ))}
            </div>
          )}

          {section.type === "pairs" && (
            <div className={styles.tagRow}>
              {section.pairs.map((pair) => (
                <span className={styles.tag} key={pair.id}>
                  {pair.left}: {pair.right}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className={styles.navRow}>
        <Button onClick={onBack} variant="ghost">
          <ArrowLeftIcon />
          Back
        </Button>
        <Button onClick={onConfirm}>Looks good, continue</Button>
      </div>
    </div>
  );
};
