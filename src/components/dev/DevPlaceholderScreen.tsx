/**
 * TEMPORARY — Phase 2 navigation scaffolding only.
 *
 * Every route created in this phase that doesn't yet have a real feature
 * screen renders this instead of duplicating a Screen+EmptyState block in
 * each route file. It exists purely to prove the route/navigation graph is
 * wired correctly (reachable, correct back behavior, correct tab-bar
 * visibility) — it carries no feature design or business logic.
 *
 * Deletion path: as each real feature screen is built, that route file
 * stops importing this and renders its real screen component instead. This
 * file itself is deleted once no route file imports it any more.
 */
import React from 'react';
import { Screen } from '../layout/Screen';
import { EmptyState } from '../ui/States';

interface DevPlaceholderScreenProps {
  title: string;
  icon: React.ReactNode;
  back?: boolean;
}

export function DevPlaceholderScreen({ title, icon, back = true }: DevPlaceholderScreenProps) {
  return (
    <Screen title={title} back={back}>
      <EmptyState
        icon={icon}
        title={`${title} — not built yet`}
        message="This screen is a Phase 2 navigation placeholder. The real design and business logic are built in a later stage."
      />
    </Screen>
  );
}
