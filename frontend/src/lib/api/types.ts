
export type UserRole = "admin" | "operator" | "passenger";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string;
  username: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
}

export interface UserRoleUpdate {
  role?: UserRole;
  is_active?: boolean;
}

export type JourneyStatus = "active" | "completed" | "cancelled";

export interface Journey {
  id: number;
  user_id: string;
  source_station_id: number;
  destination_station_id: number;
  checkin_time: string;
  checkout_time: string | null;
  fare: number;
  status: JourneyStatus;
}

export interface CheckInRequest {
  source_station_id: number;
  destination_station_id: number;
}

export interface StateInfo {
  state: string;
  cities: string[];
  station_count: number;
  train_count: number;
  has_sufficient_data: boolean;
}

export interface CityInfo {
  city: string;
  state: string | null;
  station_count: number;
  train_count: number;
  has_sufficient_data: boolean;
}

export interface Station {
  id: number;
  station_code: string;
  station_name: string;
  city: string;
  latitude: number;
  longitude: number;
  is_interchange: boolean;
  is_active: boolean;
  capacity: number;
  
  line_name: string | null;
  line_color: string | null;
  station_order: number | null;
}

export type CrowdLevel = "low" | "moderate" | "high" | "critical";

export interface CrowdSnapshot {
  station_id: number;
  station_name: string;
  capacity: number;
  current_count: number;
  crowd_level: CrowdLevel;
  occupancy_ratio: number;
  last_updated: string | null;
}

export interface CrowdHeatmapPoint extends CrowdSnapshot {
  latitude: number;
  longitude: number;
}

export interface InflowOutflow {
  station_id: number;
  window_hours: number;
  inflow: number;
  outflow: number;
  samples: number;
}

export interface StationMonitorEntry extends CrowdSnapshot {
  inflow: number;
  outflow: number;
}

export interface StationAnalytics {
  station_id: number;
  average_count_24h: number;
  peak_count_24h: number;
  min_count_24h: number;
  samples: number;
}

export type DayType = "weekday" | "weekend" | "holiday";
export type ScheduleStatus = "on_time" | "delayed" | "cancelled" | "completed";

export interface UpcomingScheduleEntry {
  id: number;
  train_id: number;
  train_number: string;
  from_station_id: number;
  from_station_name: string;
  line_name: string | null;
  line_color: string | null;
  to_station_name: string | null;
  departure_time: string;
  status: ScheduleStatus;
  delay_minutes: number;
}

export interface TrainSchedule {
  id: number;
  train_id: number;
  station_id: number;
  arrival_time: string;
  departure_time: string;
  platform_number: number;
  day_type: DayType;
  is_peak_hour: boolean;
  frequency_minutes: number;
  status: ScheduleStatus;
  delay_minutes: number;
  actual_arrival_time: string | null;
  actual_departure_time: string | null;
}

export type TrainStatus =
  | "active"
  | "in_service"
  | "delayed"
  | "maintenance"
  | "out_of_service";

export interface Train {
  id: number;
  train_number: string;
  capacity: number;
  status: TrainStatus;
  is_active: boolean;
}

export interface LiveTrainPosition {
  train_id: number;
  train_number: string;
  from_station_id: number;
  from_station_name: string | null;
  to_station_id: number;
  to_station_name: string | null;
  progress_ratio: number;
  delay_minutes: number;
  status: string;
  eta_seconds: number | null;
  segment_duration_seconds: number | null;
  direction: number;
}

export interface TrainRoute {
  train_id: number;
  train_number: string;
  station_ids: number[];
  station_names: (string | null)[];
  segment_seconds: number[];
}

export type PredictionType = "crowd" | "demand" | "delay" | "frequency";

export interface Prediction {
  id: number;
  station_id: number;
  predicted_count: number | null;
  confidence: number;
  prediction_type: PredictionType;
  predicted_value: number;
  target_datetime: string | null;
  model_version: string | null;
  // Per-candidate breakdown (currently "random_forest" and "xgboost"
  // keys), same pattern as CrowdModelMetrics.models - lets a caller
  // show both models side by side instead of only the winner that
  // predicted_value/model_version above mirror. Shape varies by
  // prediction_type: crowd candidates carry predicted_count/
  // confidence, delay candidates carry predicted_delay_minutes,
  // frequency candidates carry recommended_frequency_minutes -
  // always alongside model_version.
  models: Record<string, PredictionModelCandidate>;
}

export interface PredictionModelCandidate {
  model_version: string;
  predicted_count?: number;
  confidence?: number | null;
  predicted_delay_minutes?: number;
  recommended_frequency_minutes?: number;
}

export interface SmartRecommendation {
  station_id: number;
  title: string;
  detail: string;
  severity: "info" | "warning";
}

export interface TrafficPatternPoint {
  hour: number;
  predicted_count: number;
  is_peak_hour: boolean;
}

export interface TrafficPatternResponse {
  station_id: number;
  hourly_forecast: TrafficPatternPoint[];
  peak_hour: number;
  peak_predicted_count: number;
  quietest_hour: number;
}

export interface TrafficReportStationRow {
  station_id: number;
  station_name: string;
  average_count: number;
  peak_count: number;
}

export interface TrafficReport {
  window_hours: number;
  stations: TrafficReportStationRow[];
  busiest_station: TrafficReportStationRow | null;
  currently_delayed_schedules: number;
  generated_at: string;
}

export interface OperationalSummary {
  active_stations: number;
  total_scheduled_trips: number;
  currently_delayed: number;
  on_time_rate: number;
}

export interface PassengerFlowStationRow {
  station_id: number;
  station_name: string;
  entries: number;
  exits: number;
}

export interface RidershipByLineRow {
  line_name: string;
  color: string;
  passenger_count: number;
}

export interface PassengerFlowOverview {
  window_hours: number;
  total_inflow: number;
  total_outflow: number;
  net_flow: number;
  avg_predicted_occupancy: number;
  top_stations: PassengerFlowStationRow[];
  ridership_by_line: RidershipByLineRow[];
  generated_at: string;
}

export type AlertType =
  | "overcrowding"
  | "delay"
  | "emergency"
  | "maintenance"
  | "info";

export interface Alert {
  id: number;
  station_id: number;
  alert_type: AlertType;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  
  available_until: string | null;
  notify_email: boolean;
  notify_sms: boolean;
  created_at: string;
}

export interface AlertCreate {
  station_id: number;
  alert_type: AlertType;
  message: string;
  
  notify_email?: boolean;
  
  notify_sms?: boolean;
  
  available_until?: string | null;
}

export interface AlertResolvePayload {
  notify_on_resolve?: boolean;
}

export type NotificationChannel = "email" | "sms";
export type NotificationStatus = "sent" | "failed";

export interface NotificationLog {
  id: number;
  alert_id: number;
  channel: NotificationChannel;
  recipient: string;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export type EnquiryStatus = "open" | "in_progress" | "resolved";

export type EnquiryCategory =
  | "general"
  | "ticketing"
  | "lost_and_found"
  | "safety"
  | "technical"
  | "complaint"
  | "suggestion"
  | "other";

export interface EnquirerSummary {
  id: string;
  full_name: string;
  email: string | null;
}

export interface Enquiry {
  id: number;
  user_id: string;
  subject: string;
  category: EnquiryCategory;
  message: string;
  status: EnquiryStatus;
  admin_reply: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user: EnquirerSummary | null;
}

export interface EnquiryCreate {
  subject: string;
  category: EnquiryCategory;
  message: string;
}

export interface EnquiryResolvePayload {
  admin_reply: string;
  status?: EnquiryStatus;
}

export interface EnquiryStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
}

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsCreate {
  title: string;
  content: string;
}

export interface NewsUpdate {
  title?: string;
  content?: string;
  is_active?: boolean;
}

export type NotificationSource = "email" | "operator" | "system" | "system_failure";

export interface Notification {
  id: number;
  user_id: string | null;
  source: NotificationSource;
  title: string;
  message: string;
  related_alert_id: number | null;
  /** City/state this notification is about (e.g. "Kolkata"), or null
   * if it's global (system announcements, login notices, etc.) and
   * should always show regardless of the selected state/city filter. */
  state: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationUnreadCount {
  unread: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface CrowdSingleModelMetrics {
  available: boolean;
  model_name: string | null;
  mae: number | null;
  mape_pct: number | null;
  r2: number | null;
  accuracy: number | null;
  macro_f1: number | null;
  critical_recall: number | null;
  trained_rows: number | null;
  test_rows: number | null;
  classes: CrowdLevel[];
  confusion_matrix: number[][];
  feature_importance: FeatureImportanceItem[];
}

export interface CrowdModelMetrics extends CrowdSingleModelMetrics {
  // Per-candidate breakdown, currently keyed "random_forest" and
  // "xgboost", so both can be shown side by side instead of only the
  // winner (which the flat fields above still mirror).
  models: Record<string, CrowdSingleModelMetrics>;
}

export interface RegressionSingleModelMetrics {
  // Same shape as CrowdSingleModelMetrics minus the
  // classification-only fields (accuracy/macro_f1/critical_recall/
  // classes/confusion_matrix) that don't apply to a pure regression
  // target such as delay minutes or recommended headway minutes.
  available: boolean;
  model_name: string | null;
  mae: number | null;
  mape_pct: number | null;
  r2: number | null;
  trained_rows: number | null;
  test_rows: number | null;
  feature_importance: FeatureImportanceItem[];
}

export interface RegressionModelMetrics extends RegressionSingleModelMetrics {
  // Per-candidate breakdown, currently keyed "random_forest" and
  // "xgboost", so both can be shown side by side instead of only the
  // winner (which the flat fields above still mirror). Powers the
  // delay and frequency sections of the AI Prediction page.
  models: Record<string, RegressionSingleModelMetrics>;
}