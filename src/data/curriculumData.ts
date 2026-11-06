import moduleData from './courseModules.json';
import type { CourseModule } from '@/types';

export const DRIVE_ROOT_FOLDER_ID = '1_BmOiFVvMh-It6MET5cCHxugu77i5V1c';
export const DRIVE_ROOT_URL = `https://drive.google.com/drive/folders/${DRIVE_ROOT_FOLDER_ID}?usp=drive_link`;
export const COURSE_MODULES = moduleData as CourseModule[];
