import { en as $vuetify } from 'vuetify/locale';
import guides from './guides.json';
import settings from './settings.json';
import common from './common.json';

const messages = {
  guide: {
    ...guides,
  },
  settings: {
    ...settings,
  },
  common: {
    ...common,
  },
  currentlanguage: 'English',
  $vuetify,
};

export default messages;
