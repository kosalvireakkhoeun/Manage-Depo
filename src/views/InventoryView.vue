<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Product } from '@/types/inventory'
import { useInventoryStore } from '@/stores/inventory'

const inventoryStore = useInventoryStore()

const filters = reactive({
  nameQuery: '',
  barcodeQuery: '',
  categoryId: '',
})

const activeFilters = reactive({
  nameQuery: '',
  barcodeQuery: '',
  categoryId: '',
})

const currentPage = ref(1)
const perPage = ref(10)
const perPageOptions = [10, 20, 50]
const selectedProduct = ref<Product | null>(null)
const isProductDetailOpen = ref(false)

const paginatedProducts = computed(() => {
  const totalItems = inventoryStore.totalProducts
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage.value))
  const normalizedCurrentPage = Math.min(Math.max(1, currentPage.value), totalPages)
  const startItem = totalItems === 0 ? 0 : (normalizedCurrentPage - 1) * perPage.value + 1
  const endItem = totalItems === 0 ? 0 : startItem + inventoryStore.products.length - 1

  return {
    pageItems: inventoryStore.products,
    totalItems,
    totalPages,
    currentPage: normalizedCurrentPage,
    startItem,
    endItem,
  }
})

const isLoading = computed(() => inventoryStore.loadingCategories)
const isTableLoading = computed(() => inventoryStore.loadingProducts)

async function fetchProducts() {
  await inventoryStore.fetchProducts({
    nameQuery: activeFilters.nameQuery,
    barcodeQuery: activeFilters.barcodeQuery,
    categoryId: activeFilters.categoryId,
    page: currentPage.value,
    perPage: perPage.value,
  })
}

function applySearch() {
  activeFilters.nameQuery = filters.nameQuery
  activeFilters.barcodeQuery = filters.barcodeQuery
  activeFilters.categoryId = filters.categoryId

  if (currentPage.value !== 1) {
    currentPage.value = 1
    return
  }

  void fetchProducts()
}

function goToPreviousPage() {
  currentPage.value = Math.max(1, currentPage.value - 1)
}

function goToNextPage() {
  currentPage.value = Math.min(paginatedProducts.value.totalPages, currentPage.value + 1)
}

watch(perPage, () => {
  currentPage.value = 1
})

watch(
  () => [currentPage.value, perPage.value],
  () => {
    void fetchProducts()
  },
)

watch(paginatedProducts, (pagination) => {
  if (currentPage.value !== pagination.currentPage) {
    currentPage.value = pagination.currentPage
  }
})

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function openProductDetail(product: Product) {
  selectedProduct.value = product
  isProductDetailOpen.value = true
}

function closeProductDetail() {
  selectedProduct.value = null
  isProductDetailOpen.value = false
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

onMounted(async () => {
  if (inventoryStore.categories.length === 0) {
    await inventoryStore.fetchCategories()
  }

  await fetchProducts()
})
</script>

<template>
  <section class="space-y-4">
    <div
      class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <h3 class="mb-4 text-lg font-semibold">Search & Filter</h3>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label class="mb-1 block text-sm font-medium">Search by Name</label>
          <input
            v-model="filters.nameQuery"
            type="text"
            class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Type product name"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Partial Barcode Search</label>
          <input
            v-model="filters.barcodeQuery"
            type="text"
            class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Type barcode digits"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Category</label>
          <select
            v-model="filters.categoryId"
            class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">All Categories</option>
            <option
              v-for="category in inventoryStore.categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="mt-3 flex justify-end">
        <button
          type="button"
          class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
          @click="applySearch"
        >
          Search
        </button>
      </div>
    </div>

    <p
      v-if="inventoryStore.error"
      class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-200"
    >
      {{ inventoryStore.error }}
    </p>

    <div
      v-if="isLoading"
      class="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
    >
      Loading inventory...
    </div>

    <div v-else class="space-y-4">
      <div
        v-if="isTableLoading"
        class="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
      >
        Loading products...
      </div>

      <div
        v-else-if="paginatedProducts.totalItems === 0"
        class="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
      >
        No products found for your current filters.
      </div>

      <template v-else>
        <div class="grid gap-3 md:hidden">
          <article
            v-for="product in paginatedProducts.pageItems"
            :key="product.id"
            class="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            @click="openProductDetail(product)"
          >
            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <h4 class="font-semibold">{{ product.name }}</h4>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Barcode: {{ product.barcode }}
                </p>
              </div>
              <span class="rounded-full bg-neutral-200 px-2 py-1 text-xs dark:bg-neutral-800">
                {{ inventoryStore.getMappedCategoryName(product.category_id) || 'No Category' }}
              </span>
            </div>

            <div
              class="mb-3 aspect-square flex justify-center w-full max-h-56 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
            >
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-xs text-neutral-400"
              >
                No Image
              </div>
            </div>

            <dl class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Unit</dt>
                <dd>{{ product.unit }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Cost</dt>
                <dd>{{ formatPrice(product.cost_price) }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Wholesale</dt>
                <dd>{{ formatPrice(product.wholesale_price) }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Retail</dt>
                <dd>{{ formatPrice(product.retail_price) }}</dd>
              </div>
            </dl>
          </article>
        </div>

        <div
          class="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:block"
        >
          <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead class="bg-neutral-50 dark:bg-neutral-900">
              <tr class="text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
                <th class="px-4 py-3">Image</th>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Barcode</th>
                <th class="px-4 py-3">Unit</th>
                <th class="px-4 py-3">Cost</th>
                <th class="px-4 py-3">Wholesale</th>
                <th class="px-4 py-3">Retail</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr
                v-for="product in paginatedProducts.pageItems"
                :key="product.id"
                class="cursor-pointer text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                @click="openProductDetail(product)"
              >
                <td class="px-4 py-3">
                  <div
                    class="h-12 w-12 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
                  >
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      :alt="product.name"
                      class="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-xs text-neutral-400"
                    >
                      No
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 font-medium">{{ product.name }}</td>
                <td class="px-4 py-3">
                  {{ inventoryStore.getMappedCategoryName(product.category_id) || 'No Category' }}
                </td>
                <td class="px-4 py-3">{{ product.barcode }}</td>
                <td class="px-4 py-3">{{ product.unit }}</td>
                <td class="px-4 py-3">{{ formatPrice(product.cost_price) }}</td>
                <td class="px-4 py-3">{{ formatPrice(product.wholesale_price) }}</td>
                <td class="px-4 py-3">{{ formatPrice(product.retail_price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-2 text-sm">
            <label for="inventory-per-page" class="text-neutral-500 dark:text-neutral-400"
              >Per page</label
            >
            <select
              id="inventory-per-page"
              v-model.number="perPage"
              class="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option v-for="option in perPageOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <span class="text-neutral-500 dark:text-neutral-400">
              Showing {{ paginatedProducts.startItem }}-{{ paginatedProducts.endItem }} of
              {{ paginatedProducts.totalItems }}
            </span>
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700"
              :disabled="paginatedProducts.currentPage === 1"
              @click="goToPreviousPage"
            >
              Previous
            </button>
            <span class="text-neutral-500 dark:text-neutral-400">
              {{ paginatedProducts.currentPage }}/{{ paginatedProducts.totalPages }}
            </span>
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700"
              :disabled="paginatedProducts.currentPage === paginatedProducts.totalPages"
              @click="goToNextPage"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="isProductDetailOpen && selectedProduct"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeProductDetail"
    >
      <article
        class="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div class="mb-4 flex items-center justify-between gap-2">
          <h3 class="text-lg font-semibold">Product Detail</h3>
          <button
            type="button"
            class="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
            @click="closeProductDetail"
          >
            Close
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          <div
            class="flex justify-center h-full w-full overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
          >
            <img
              v-if="selectedProduct.image_url"
              :src="selectedProduct.image_url"
              :alt="selectedProduct.name"
              class="h-full w-full max-w-56 object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-xs text-neutral-400"
            >
              No Image
            </div>
          </div>

          <dl class="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Name</dt>
              <dd class="font-medium">{{ selectedProduct.name }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Category</dt>
              <dd>
                {{
                  inventoryStore.getMappedCategoryName(selectedProduct.category_id) || 'No Category'
                }}
              </dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Barcode</dt>
              <dd>{{ selectedProduct.barcode }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Unit</dt>
              <dd>{{ selectedProduct.unit }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Cost</dt>
              <dd>{{ formatPrice(selectedProduct.cost_price) }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Wholesale</dt>
              <dd>{{ formatPrice(selectedProduct.wholesale_price) }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Retail</dt>
              <dd>{{ formatPrice(selectedProduct.retail_price) }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Created</dt>
              <dd>{{ formatDate(selectedProduct.created_at) }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Description</dt>
              <dd>{{ selectedProduct.description || '—' }}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  </section>
</template>
