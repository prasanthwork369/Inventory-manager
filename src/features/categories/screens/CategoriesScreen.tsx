/**
 * Direct port of the web reference's src/pages/products/Categories.tsx.
 * The web source keeps the whole feature — list, add/edit sheet, delete
 * confirm — in one component with no sub-components; this mirrors that
 * (one screen file, a local `CategoryTile` for the repeated row, matching
 * how the web repeats its Card inline). `sm:grid-cols-2` is desktop-only;
 * the web source itself renders single-column at mobile width, so this is
 * that same order, not a redesign.
 *
 * Delete wording: the confirm dialog still says "Delete" (matches the web
 * source's visible copy exactly) — the operation underneath is
 * archiveCategory (isActive = false), never a physical delete, same
 * production-safety correction already applied to Products.
 */
import React from 'react';
import { router } from 'expo-router';
import { Pencil, Plus, Shapes, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog, AppSheet } from '@/components/ui/AppSheet';
import { Field, Input, Textarea } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { CATEGORY_ICON_OPTIONS } from '../constants';
import { useCategories } from '../hooks/useCategories';
import type { CategoryWithProductCount } from '../types';

export function CategoriesScreen() {
  const toast = useToast();
  const {
    status,
    categories,
    refetch,
    editingDraft,
    isEditingExisting,
    formError,
    saving,
    openCreate,
    openEdit,
    closeEditor,
    updateDraftField,
    save,
    removingCategory,
    openRemove,
    closeRemove,
    confirmArchive,
  } = useCategories();

  const handleSave = async () => {
    const succeeded = await save();
    if (succeeded) toast('Category saved.');
  };

  const handleConfirmArchive = () => {
    confirmArchive().then(() => toast('Category deleted.', 'info'));
  };

  return (
    <Screen
      title="Categories"
      subtitle={status === 'ready' ? `${categories.length} categories` : undefined}
      wide
      actions={
        <Button size="sm" icon={<Plus size={16} color={colors.white} />} onPress={openCreate}>
          New
        </Button>
      }
    >
      {status === 'loading' && <ListSkeleton rows={5} />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load categories" message="Something went wrong loading your categories. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && categories.length === 0 && (
        <EmptyState
          icon={<Shapes size={28} color={colors.brand[600]} />}
          title="No categories yet"
          message="Group your products into categories so lists and reports are easier to scan."
          actionLabel="Add category"
          onAction={openCreate}
        />
      )}

      {status === 'ready' && categories.length > 0 && (
        <View style={styles.list}>
          {categories.map((c) => (
            <CategoryTile key={c.id} category={c} onEdit={() => openEdit(c)} onRemove={() => openRemove(c)} />
          ))}
        </View>
      )}

      <AppSheet
        open={!!editingDraft}
        onClose={closeEditor}
        title={isEditingExisting ? 'Edit category' : 'Add category'}
        footer={
          <Button block size="lg" loading={saving} onPress={handleSave}>
            Save Category
          </Button>
        }
      >
        {editingDraft && (
          <View style={styles.formStack}>
            <Field label="Category name" required error={formError}>
              <Input
                value={editingDraft.name}
                onChangeText={(v) => updateDraftField('name', v)}
                placeholder="e.g. Beverages"
                invalid={!!formError}
              />
            </Field>
            <Field label="Icon">
              <View style={styles.iconGrid}>
                {CATEGORY_ICON_OPTIONS.map((icon) => {
                  const selected = editingDraft.icon === icon;
                  return (
                    <Pressable
                      key={icon}
                      onPress={() => updateDraftField('icon', icon)}
                      accessibilityRole="button"
                      accessibilityLabel={`Choose icon ${icon}`}
                      style={({ pressed }) => [
                        styles.iconOption,
                        selected ? styles.iconOptionSelected : pressed && styles.iconOptionPressed,
                      ]}
                    >
                      <AppText size={20}>{icon}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
            <Field label="Description" hint="Optional">
              <Textarea
                value={editingDraft.description}
                onChangeText={(v) => updateDraftField('description', v)}
                placeholder="What belongs in this category?"
              />
            </Field>
          </View>
        )}
      </AppSheet>

      <ConfirmDialog
        open={!!removingCategory}
        onClose={closeRemove}
        title={`Delete ${removingCategory?.name}?`}
        message="Products in this category will stay, but they will show as uncategorised."
        confirmLabel="Delete category"
        detail={removingCategory ? `${removingCategory.productCount} products currently use this category` : undefined}
        onConfirm={handleConfirmArchive}
      />
    </Screen>
  );
}

interface CategoryTileProps {
  category: CategoryWithProductCount;
  onEdit: () => void;
  onRemove: () => void;
}

function CategoryTile({ category, onEdit, onRemove }: CategoryTileProps) {
  const caption = `${category.productCount} product${category.productCount === 1 ? '' : 's'}${category.description ? ` · ${category.description}` : ''}`;

  return (
    <Card style={styles.tile}>
      <View style={styles.tileIcon}>
        <AppText size={20}>{category.icon}</AppText>
      </View>
      <Pressable
        onPress={() => router.push({ pathname: '/products', params: { category: category.id } })}
        style={styles.tileBody}
        accessibilityRole="button"
      >
        <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
          {category.name}
        </AppText>
        <AppText size={12.5} color={colors.ink[500]} numberOfLines={1}>
          {caption}
        </AppText>
      </Pressable>
      <IconButton accessibilityLabel={`Edit ${category.name}`} onPress={onEdit}>
        <Pencil size={16} color={colors.ink[500]} />
      </IconButton>
      <IconButton accessibilityLabel={`Delete ${category.name}`} onPress={onRemove}>
        <Trash2 size={16} color={colors.bad[500]} />
      </IconButton>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing[2.5] },
  tile: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3.5] },
  tileIcon: {
    height: spacing[11],
    width: spacing[11],
    borderRadius: radius.xl,
    backgroundColor: colors.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBody: { flex: 1, minWidth: 0 },
  formStack: { gap: spacing[4] },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  iconOption: {
    height: spacing[11],
    width: spacing[11],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  iconOptionPressed: { backgroundColor: colors.ink[50] },
});
