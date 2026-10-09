<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Product } from '@/types/inventory'
import { useInventoryStore } from '@/stores/inventory'
import { buildProductPayload, type ProductFormValues } from '@/utils/productValidation'

const inventoryStore = useInventoryStore()

const editingProductId = ref<string | null>(null)
const selectedImage = ref<File | null>(null)
const feedbackMessage = ref<string | null>(null)
const feedbackKind = ref<'success' | 'error'>('success')

const productForm = reactive<ProductFormValues>({
  name: '',
  barcode: '',
  description: '',
  category_id: '',
  cost_price: '',
  wholesale_price: '',
  retail_price: '',
  unit: '',
})

const isBusy = computed(
  () =>
    inventoryStore.submitting ||
    inventoryStore.loadingProducts ||
    inventoryStore.loadingCategories ||
    inventoryStore.loadingStats,
)

function resetForm() {
  productForm.name = ''
  productForm.barcode = ''
  productForm.description = ''
  productForm.category_id = ''
  productForm.cost_price = ''
  productForm.wholesale_price = ''
  productForm.retail_price = ''
  productForm.unit = ''
  selectedImage.value = null
  editingProductId.value = null
}

function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  selectedImage.value = input.files?.[0] ?? null
}

function startEdit(product: Product) {
  editingProductId.value = product.id
  productForm.name = product.name
  productForm.barcode = product.barcode
  productForm.description = product.description ?? ''
  productForm.category_id = product.category_id ?? ''
  productForm.cost_price = String(product.cost_price)
  productForm.wholesale_price = String(product.wholesale_price)
  productForm.retail_price = String(product.retail_price)
  productForm.unit = product.unit
  selectedImage.value = null
  feedbackMessage.value = null
}

async function saveProduct() {
  const payload = buildProductPayload(productForm)

  if (!payload) {
    feedbackKind.value = 'error'
    feedbackMessage.value = 'Please fill all required fields and valid non-negative prices.'
    return
  }

  try {
    await inventoryStore.saveProduct(
      payload,
      editingProductId.value ?? undefined,
      selectedImage.value,
    )
    await inventoryStore.fetchStats()
    feedbackKind.value = 'success'
    feedbackMessage.value = editingProductId.value
      ? 'Product updated successfully.'
      : 'Product created successfully.'
    resetForm()
  } catch {
    feedbackKind.value = 'error'
    feedbackMessage.value = inventoryStore.error ?? 'Failed to save product.'
  }
}

async function removeProduct(product: Product) {
  if (!window.confirm(`Delete ${product.name}?`)) {
    return
  }

  try {
    await inventoryStore.removeProduct(product)
    await inventoryStore.fetchStats()
    feedbackKind.value = 'success'
    feedbackMessage.value = 'Product deleted.'
  } catch {
    feedbackKind.value = 'error'
    feedbackMessage.value = inventoryStore.error ?? 'Failed to delete product.'
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

onMounted(async () => {
  await Promise.all([
    inventoryStore.fetchProducts(),
    inventoryStore.fetchCategories(),
    inventoryStore.fetchStats(),
  ])
})
</script>

<template>
  <section class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Products</p>
        <p class="mt-2 text-2xl font-semibold">{{ inventoryStore.stats?.productCount ?? 0 }}</p>
      </article>
      <article class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Categories</p>
        <p class="mt-2 text-2xl font-semibold">{{ inventoryStore.stats?.categoryCount ?? 0 }}</p>
      </article>
      <article class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Admins</p>
        <p class="mt-2 text-2xl font-semibold">{{ inventoryStore.stats?.adminCount ?? 0 }}</p>
      </article>
      <article class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Staff</p>
        <p class="mt-2 text-2xl font-semibold">{{ inventoryStore.stats?.staffCount ?? 0 }}</p>
      </article>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
      <article class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 class="text-lg font-semibold">{{ editingProductId ? 'Edit Product' : 'Add Product' }}</h3>
        <p class="mb-4 text-sm text-neutral-500 dark:text-neutral-400">Required fields are marked by validation.</p>

        <form class="space-y-3" @submit.prevent="saveProduct">
          <div>
            <label class="mb-1 block text-sm">Name</label>
            <input
              v-model="productForm.name"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Product name"
              required
            />
          </div>

          <div>
            <label class="mb-1 block text-sm">Barcode</label>
            <input
              v-model="productForm.barcode"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Unique barcode"
              required
            />
          </div>

          <div>
            <label class="mb-1 block text-sm">Description</label>
            <textarea
              v-model="productForm.description"
              rows="2"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm">Category</label>
            <select
              v-model="productForm.category_id"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">No Category</option>
              <option
                v-for="category in inventoryStore.categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm">Cost Price (តម្លៃទិញចូល)</label>
              <input
                v-model="productForm.cost_price"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm">Wholesale (តម្លៃបោះដុំ)</label>
              <input
                v-model="productForm.wholesale_price"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm">Retail (តម្លៃលក់រាយ)</label>
              <input
                v-model="productForm.retail_price"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                required
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm">Unit</label>
            <input
              v-model="productForm.unit"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="pcs, box, pack, kg"
              required
            />
          </div>

          <div>
            <label class="mb-1 block text-sm">Product Image</label>
            <input
              type="file"
              accept="image/*"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:text-white dark:border-neutral-700 dark:bg-neutral-900 dark:file:bg-white dark:file:text-neutral-900"
              @change="onImageSelected"
            />
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="submit"
              class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900"
              :disabled="isBusy"
            >
              {{ editingProductId ? 'Update Product' : 'Create Product' }}
            </button>
            <button
              v-if="editingProductId"
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

      <article class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 class="mb-4 text-lg font-semibold">Product Management</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            <thead>
              <tr class="text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
                <th class="px-3 py-2">Name</th>
                <th class="px-3 py-2">Category</th>
                <th class="px-3 py-2">Barcode</th>
                <th class="px-3 py-2">Retail</th>
                <th class="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr v-for="product in inventoryStore.products" :key="product.id">
                <td class="px-3 py-2 font-medium">{{ product.name }}</td>
                <td class="px-3 py-2">{{ product.category_name || 'No Category' }}</td>
                <td class="px-3 py-2">{{ product.barcode }}</td>
                <td class="px-3 py-2">{{ formatPrice(product.retail_price) }}</td>
                <td class="px-3 py-2">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                      @click="startEdit(product)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                      @click="removeProduct(product)"
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
    </div>
  </section>
</template>