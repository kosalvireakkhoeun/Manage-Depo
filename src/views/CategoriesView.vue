<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Category } from '@/types/inventory'
import { useInventoryStore } from '@/stores/inventory'

const inventoryStore = useInventoryStore()

const categoryName = ref('')
const editingCategoryId = ref<string | null>(null)
const feedbackMessage = ref<string | null>(null)
const feedbackKind = ref<'success' | 'error'>('success')

function startEdit(category: Category) {
  editingCategoryId.value = category.id
  categoryName.value = category.name
  feedbackMessage.value = null
}

function resetForm() {
  editingCategoryId.value = null
  categoryName.value = ''
}

async function saveCategory() {
  if (!categoryName.value.trim()) {
    feedbackKind.value = 'error'
    feedbackMessage.value = 'Category name is required.'
    return
  }

  try {
    await inventoryStore.saveCategory(categoryName.value, editingCategoryId.value ?? undefined)
    feedbackKind.value = 'success'
    feedbackMessage.value = editingCategoryId.value
      ? 'Category updated successfully.'
      : 'Category created successfully.'
    resetForm()
  } catch {
    feedbackKind.value = 'error'
    feedbackMessage.value = inventoryStore.error ?? 'Failed to save category.'
  }
}

async function removeCategory(category: Category) {
  if (!window.confirm(`Delete category "${category.name}"?`)) {
    return
  }

  try {
    await inventoryStore.removeCategory(category.id)
    feedbackKind.value = 'success'
    feedbackMessage.value = 'Category deleted.'
  } catch {
    feedbackKind.value = 'error'
    feedbackMessage.value =
      inventoryStore.error ??
      'Failed to delete category. It may still be referenced by one or more products.'
  }
}

onMounted(async () => {
  await inventoryStore.fetchCategories()
})
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
    <article
      class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <h3 class="text-lg font-semibold">
        {{ editingCategoryId ? 'Edit Category' : 'Add Category' }}
      </h3>
      <p class="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        Manage product categories for inventory filters and product classification.
      </p>

      <form class="space-y-3" @submit.prevent="saveCategory">
        <div>
          <label class="mb-1 block text-sm">Category Name</label>
          <input
            v-model="categoryName"
            type="text"
            class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Drinks, Snacks, ..."
            required
          />
        </div>

        <div class="flex items-center gap-2">
          <button
            type="submit"
            class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900"
            :disabled="inventoryStore.submitting"
          >
            {{ editingCategoryId ? 'Update Category' : 'Create Category' }}
          </button>

          <button
            v-if="editingCategoryId"
            type="button"
            class="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
            @click="resetForm"
          >
            Cancel
          </button>
        </div>
      </form>

      <p
        v-if="feedbackMessage"
        class="mt-3 rounded-md px-3 py-2 text-sm"
        :class="
          feedbackKind === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200'
        "
      >
        {{ feedbackMessage }}
      </p>
    </article>

    <article
      class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <h3 class="mb-4 text-lg font-semibold">Category Management</h3>

      <div
        v-if="inventoryStore.loadingCategories"
        class="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
      >
        Loading categories...
      </div>

      <div
        v-else-if="inventoryStore.categories.length === 0"
        class="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
      >
        No categories available.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
          <thead>
            <tr class="text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
              <th class="px-3 py-2">Name</th>
              <th class="px-3 py-2">Created</th>
              <th class="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="category in inventoryStore.categories" :key="category.id">
              <td class="px-3 py-2 font-medium">{{ category.name }}</td>
              <td class="px-3 py-2">{{ new Date(category.created_at).toLocaleDateString() }}</td>
              <td class="px-3 py-2">
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                    @click="startEdit(category)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                    @click="removeCategory(category)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
