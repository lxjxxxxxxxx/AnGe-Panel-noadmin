<script setup lang="ts">
import { NButton, NCard, NDivider, NInput, NModal, NSpace, NTable, useDialog, useMessage } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { createAccessToken, deleteAccessToken, getAccessTokenList } from '@/api/panel/userAccessToken'
import { SvgIcon } from '@/components/common'
import { useAuthStore } from '@/store'
import { t } from '@/locales'

const ms = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()

const list = ref<Login.AccessTokenItem[]>([])
const loading = ref(false)
const createModalShow = ref(false)
const createLoading = ref(false)
const newTokenName = ref('')
const createdToken = ref<Login.AccessTokenCreateResponse | null>(null)

async function fetchList() {
  loading.value = true
  try {
    const res = await getAccessTokenList<Login.AccessTokenListResponse>()
    if (res.code === 0)
      list.value = res.data.list
  }
  finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!newTokenName.value.trim())
    return
  createLoading.value = true
  try {
    const res = await createAccessToken<Login.AccessTokenCreateResponse>({ name: newTokenName.value.trim() })
    if (res.code === 0) {
      createdToken.value = res.data
      newTokenName.value = ''
      await fetchList()
    }
  }
  finally {
    createLoading.value = false
  }
}

function handleDelete(item: Login.AccessTokenItem) {
  dialog.warning({
    title: t('common.warning'),
    content: t('apps.userAccessToken.deleteConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      const res = await deleteAccessToken({ id: item.id })
      if (res.code === 0) {
        ms.success(t('common.deleteSuccess'))
        await fetchList()
      }
    },
  })
}

function handleCopyToken(token: string) {
  navigator.clipboard.writeText(token).then(() => {
    ms.success(t('apps.userAccessToken.copySuccess'))
  })
}

function closeCreateModal() {
  createModalShow.value = false
  createdToken.value = null
}

function openCreateModal() {
  newTokenName.value = ''
  createdToken.value = null
  createModalShow.value = true
}

function formatTime(tStr: string | undefined) {
  if (!tStr || tStr.startsWith('0001'))
    return t('apps.userAccessToken.never')
  const d = new Date(tStr)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="bg-slate-200 dark:bg-zinc-900 p-2 h-full">
    <NCard style="border-radius:10px" size="small">
      <div class="flex items-center justify-between mb-3">
        <div class="text-slate-500 font-bold">
          {{ $t('apps.userAccessToken.appName') }}
        </div>
        <NButton size="small" type="primary" @click="openCreateModal">
          {{ $t('apps.userAccessToken.create') }}
        </NButton>
      </div>

      <div class="text-xs text-slate-400 mb-3 leading-relaxed">
        {{ $t('apps.userAccessToken.usageHint') }}
      </div>

      <NCard v-if="list.length === 0 && !loading" size="small" :bordered="false" style="border-radius:10px">
        <div class="text-center text-slate-400 py-4">
          {{ $t('apps.userAccessToken.noTokens') }}
        </div>
      </NCard>

      <NCard v-for="item in list" v-else :key="item.id" size="small" style="border-radius:10px" class="mb-2">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium">
              {{ item.name }}
            </div>
            <div class="text-xs text-slate-400 mt-1">
              {{ $t('apps.userAccessToken.lastUsed') }}: {{ formatTime(item.lastUsedAt) }}
            </div>
          </div>
          <NButton size="tiny" type="error" quaternary @click="handleDelete(item)">
            {{ $t('common.delete') }}
          </NButton>
        </div>
      </NCard>
    </NCard>

    <NModal :show="createModalShow" preset="card" style="max-width: 480px" :title="$t('apps.userAccessToken.create')" closable @update:show="closeCreateModal">
      <div v-if="!createdToken">
        <div class="mb-3">
          <NInput
            v-model:value="newTokenName"
            :placeholder="$t('apps.userAccessToken.namePlaceholder')"
            clearable
            @keydown.enter="handleCreate"
          />
        </div>
        <div class="flex justify-end">
          <NButton type="primary" :loading="createLoading" @click="handleCreate">
            {{ $t('apps.userAccessToken.create') }}
          </NButton>
        </div>
      </div>
      <div v-else>
        <div class="text-green-600 font-bold mb-3">
          {{ $t('apps.userAccessToken.createSuccess') }}
        </div>
        <div class="text-xs text-slate-400 mb-1">
          {{ $t('apps.userAccessToken.tokenValueLabel') }}
        </div>
        <div class="flex items-center gap-2 mb-3">
          <NInput :value="createdToken.token" readonly />
          <NButton type="primary" @click="handleCopyToken(createdToken.token)">
            {{ $t('apps.userAccessToken.copyToken') }}
          </NButton>
        </div>
        <div class="flex justify-end">
          <NButton @click="closeCreateModal">
            {{ $t('common.close') }}
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>
