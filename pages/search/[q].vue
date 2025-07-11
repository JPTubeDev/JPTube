<script setup lang="ts">
import type { Types } from 'youtubei.js';
import { YT, Helpers, YTNodes } from 'youtubei.js';
import type { LocationQueryValue } from 'vue-router';

const route = useRoute();
const router = useRouter();

const results = ref<Helpers.ObservedArray<Helpers.YTNode>>();
let sourceresults: YT.Search;
const alert = ref<boolean>(false);
const errorMessage = ref<string>('');
const filterDialog = ref<boolean>(false);
const filterOptions = ref<YTNodes.Button | null | undefined>();
const chipOptions = ref<YTNodes.ChipCloud | null | undefined>();
const uploadDateOptions: Array<Types.UploadDate> = ['hour', 'today', 'week', 'month', 'year'];
const durationOptions: Array<Types.Duration> = ['short', 'medium', 'long'];
const sortOptions: Array<Types.SortBy> = ['relevance', 'upload_date', 'view_count', 'rating'];
const typeOptions: Array<Types.SearchType> = ['video', 'channel', 'playlist', 'movie'];
const featureOptions: Array<Types.Feature> = ['live', '4k', 'hd', 'subtitles', 'creative_commons', '360', 'vr180', '3d', 'hdr', 'location', 'purchased'];
const applyFilters = async () => {
  const query: Record<string, string | LocationQueryValue[]> = {};
  if (selectedFilter.value.upload_date) {
    query.upload_date = selectedFilter.value.upload_date;
  }
  if (selectedFilter.value.duration) {
    query.duration = selectedFilter.value.duration;
  }
  if (selectedFilter.value.sort_by) {
    query.sort = selectedFilter.value.sort_by;
  }
  if (selectedFilter.value.type) {
    query.type = selectedFilter.value.type;
  }
  if (selectedFilter.value.features && selectedFilter.value.features.length > 0) {
    query.features = selectedFilter.value.features;
  }
  await router.replace({ query });
  await fetchData();
  filterDialog.value = false;
};

const applyChips = async () => {
  const chip = selectedChip.value;
  await fetchData(chip);
};

const selectedFilter = ref({
  upload_date: route.query.upload_date,
  duration: route.query.duration,
  sort_by: route.query.sort,
  type: route.query.typeData,
  features: route.query.features,
});

const selectedChip = ref<string>();

useHead({
  title: `${route.params.q as string ? route.params.q as string : 'Search'} - JPTube`,
});

const LoadMore = async ({ done }: { done: (status: 'ok' | 'empty' | 'error') => void }) => {
  try {
    if (sourceresults && sourceresults.has_continuation) {
      const continuationResults = await sourceresults.getContinuation();
      if (results.value) {
        results.value.push(...continuationResults.results);
      }
      sourceresults = continuationResults;
      done('ok');
    } else {
      done('empty');
    }
  } catch (error) {
    console.error(error);
    alert.value = true;
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = 'An unknown error occurred';
    }
    done('error');
  }
};

const fetchData = async (chip?: string) => {
  try {
    const sortData = route.query.sort as Types.SortBy || 'relevance';
    const durationData = route.query.duration as Types.Duration || 'all';
    const uploadDateData = route.query.upload_date as Types.UploadDate || 'all';
    const typeData = route.query.type as Types.SearchType || 'all';
    const featureData = route.query.features as Types.Feature[] || '';

    const filter: Types.SearchFilters = {
      upload_date: uploadDateData,
      duration: durationData,
      sort_by: sortData,
      type: typeData,
    };

    if (featureData) {
      filter.features = featureData;
    }

    const yt = await useInnertube('common');
    if (chip) {
      const nav = await yt.actions.execute('/search', { continuation: chip, parse: true });
      results.value = (((nav as { on_response_received_commands_memo: Helpers.Memo }).on_response_received_commands_memo).get('SectionList') as Helpers.ObservedArray<Helpers.YTNode>);
      sourceresults = new YT.Search(yt.actions, nav, true);
    } else {
      const searchResults = await yt.search(route.params.q as string, filter as Types.SearchFilters);
      results.value = searchResults.results;
      filterOptions.value = searchResults.header?.search_filter_button;
      chipOptions.value = searchResults.header?.chip_bar;
      sourceresults = searchResults;
    }
  } catch (error) {
    console.error(error);
    alert.value = true;
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = 'An unknown error occurred';
    }
  }
};

await fetchData();
</script>

<template>
  <v-container>
    <div>
      <v-dialog v-model="alert" max-width="500">
        <v-card>
          <v-card-title class="headline">{{ $t('common.Error') }}</v-card-title>
          <v-card-text>{{ errorMessage }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" @click="alert = false">{{ $t('common.close') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <v-chip-group v-if="chipOptions" v-model="selectedChip" color="primary" @update:modelValue="applyChips">
      <v-chip v-for="chip in chipOptions.chips" :key="chip.text" :value="chip.endpoint?.payload?.token">
        {{ chip.text }}
      </v-chip>
    </v-chip-group>

    <v-btn v-if="filterOptions" color="primary" @click="filterDialog = true">
      {{ filterOptions.text }}<v-icon right>mdi-tune</v-icon></v-btn>

    <v-dialog v-if="filterOptions" v-model="filterDialog" max-width="500">
      <v-card v-if="(filterOptions.endpoint.open_popup?.popup instanceof YTNodes.SearchFilterOptionsDialog)">
        <v-card-title class="headline">{{ filterOptions.tooltip }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-card-text class="headline">
              {{ filterOptions.endpoint.open_popup?.popup.groups?.[0]?.title }}</v-card-text>
            <v-chip-group v-model="selectedFilter.upload_date" column color="primary">
              <v-chip v-for="(option, index) in uploadDateOptions" :key="option" :value="option">
                {{ filterOptions.endpoint.open_popup?.popup.groups?.[0]?.filters?.[index]?.label }}
              </v-chip>
            </v-chip-group>
            <v-card-text class="headline">
              {{ filterOptions.endpoint.open_popup?.popup.groups?.[1]?.title }}</v-card-text>
            <v-chip-group v-model="selectedFilter.type" column color="primary">
              <v-chip v-for="(option, index) in typeOptions" :key="option" :value="option">
                {{ filterOptions.endpoint.open_popup?.popup.groups?.[1]?.filters?.[index]?.label
                }}</v-chip>
            </v-chip-group>
            <v-card-text class="headline">
              {{ filterOptions.endpoint.open_popup?.popup.groups?.[2]?.title }}</v-card-text>
            <v-chip-group v-model="selectedFilter.duration" column color="primary">
              <v-chip v-for="(option, index) in durationOptions" :key="option" :value="option">
                {{ filterOptions.endpoint.open_popup?.popup.groups?.[2]?.filters?.[index]?.label }}
              </v-chip>
            </v-chip-group>
            <v-card-text class="headline">
              {{ filterOptions.endpoint.open_popup?.popup.groups?.[3]?.title }}</v-card-text>
            <v-chip-group v-model="selectedFilter.features" multiple column color="primary">
              <v-chip v-for="(option, index) in featureOptions" :key="option" :value="option">
                {{ filterOptions.endpoint.open_popup?.popup.groups?.[3]?.filters?.[index]?.label
                }}</v-chip>
            </v-chip-group>
            <v-card-text class="headline">
              {{ filterOptions.endpoint.open_popup?.popup.groups?.[4]?.title }}</v-card-text>
            <v-chip-group v-model="selectedFilter.sort_by" column color="primary">
              <v-chip v-for="(option, index) in sortOptions" :key="option" :value="option">
                {{ filterOptions.endpoint.open_popup?.popup.groups?.[4]?.filters?.[index]?.label
                }}</v-chip>
            </v-chip-group>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="applyFilters">{{ $t('common.Apply') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-infinite-scroll v-if="results && results.length" mode="intersect" @load="LoadMore">
      <v-row :items="results" style="width: 100%; margin-left: 0;">
        <template v-for="result in results">
          <template v-if="(result instanceof Helpers.YTNode)">
            <YTNode :data="result" :page="'Search'" />
          </template>
        </template>
      </v-row>
    </v-infinite-scroll>
  </v-container>
</template>
