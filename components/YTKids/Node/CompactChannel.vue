<template>
  <v-card
    v-if="data" elevation="16"
    :to="data.endpoint?.payload?.browseId ? `/kids/channel/${data.endpoint.payload.browseId}` : ''" link>
    <v-row>
      <v-col cols="4" class="d-flex align-center justify-center">
        <v-img :src="getProxifiedUrl(data.thumbnail[0]?.url)" max-width="50%" style="border-radius: 50%;">
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular color="grey-lighten-4" indeterminate />
            </div>
          </template>
        </v-img>
      </v-col>
      <v-col cols="8">
        <v-card-title>{{ data.display_name.text }}</v-card-title>
        <v-card-subtitle>{{ data.video_count.text }}・{{ data.subscriber_count.text }}</v-card-subtitle>
      </v-col>
    </v-row>
  </v-card>
  <div v-else>
    No data was provided
  </div>
</template>

<script setup lang="ts">

import { YTNodes } from 'youtubei.js';

defineProps({
  data: YTNodes.CompactChannel,
});

</script>
