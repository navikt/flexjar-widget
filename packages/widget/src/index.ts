export * from "./components/questions/index.js";
export * from "./core/index.js";
export { FlexJarDock, type FlexJarDockProps } from "./components/FlexJarDock/index.js";
export type {
    FlexJarLabels,
    FlexJarSuccessConfig,
    FlexJarStyle,
    FlexJarBehavior,
    StorageStrategy,
} from "./components/FlexJarDock/propTypes.js";
export type { FlexJarSurveyConfig, SurveyType } from "./components/surveyTypes.js";
export {
    // Default presets
    DEFAULT_SURVEY_RATING,
    DEFAULT_SURVEY_SERVICE_FEEDBACK,
    DEFAULT_SURVEY_DISCOVERY,
    // Builder functions
    createRatingSurvey,
    createDiscoverySurvey,
    createTopTasksSurvey,
    createTaskPrioritySurvey,
} from "./presets/index.js";

