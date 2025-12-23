export const API_BASE_URL = 'https://effortlesshrm-e029cd6a5095.herokuapp.com/api/v1/';
export const WEBSOCKET_URL = 'wss://effortlesshrm-e029cd6a5095.herokuapp.com/';
export const PORTAL_BASE_URL = 'https://www.effortlesshrm.com/';

// API Success/Failure codes
export const API_SUCCESS_CODE = 'Success';
export const API_FAILURE_CODE = 'Failure';

// Date Formats
export const DATE_FORMAT = 'yyyy-MM-dd\'T\'00:00:00.000+00:00';
export const NEW_DATE_FORMAT = 'yyyy-MM-dd\'T\'00:00:00.000Z';
export const MMM_DD_YYYY = 'MMM dd yyyy';
export const YYYY_MMM_DD = 'yyyy MMM dd';

// Colors
export const PRIMARY_COLOR = '#0cd3d0';
export const SECONDARY_COLOR = '#e7fbfa';

// Authentication API's
export const LOGIN = 'users/login';
export const FORGOT_PASSWORD = 'users/forgotPassword';
export const SIGNUP = 'users/signup';

// Dashboard API's
export const HOURS_WORKED = 'dashboard/HoursWorked';
export const WEEKLY_SUMMARY = 'dashboard/weeklySummary';
export const MONTHLY_SUMMARY = 'dashboard/monthlySummary';
export const TASK_WISE_HOURS = 'dashboard/taskwiseHours';
export const TASKWISE_STATUS = 'dashboard/taskwiseStatus';
export const GET_APPLICATION_TIME_SUMMARY = 'dashboard/getApplicationTimeSummary';
export const GET_TASK_STATUS_COUNTS = 'dashboard/getTaskStatusCounts';
export const GET_LAST_INVOICE = 'pricing/last-invoice';
export const GET_UPCOMING_PAYMENT = 'pricing/upcoming-payment';
export const DAY_WORK_STATUS_BY_USER = 'dashboard/getDayWorkStatusByUser';

// Screenshots API's
export const GET_LOGS_WITH_IMAGES = 'timeLogs/getLogsWithImages';
export const GET_CURRENT_WEEK_TOTAL_TIME = 'timeLogs/getCurrentWeekTotalTime';
export const DELETE_SCREENSHOTS = 'timeLogs';
export const GET_SUBORDINATES = 'auth/roles/getSubordinates';
export const GET_USERS = 'users/getUsers';

// Task API's
export const PROJECT_LIST = 'project/projectlist';
export const TASK_LIST = 'task/tasklist';
export const USERS = 'users';
export const PROJECT_LIST_BY_USER = 'project/projectlistbyuser';
export const TASK_LIST_BY_USER = 'task/tasklistbyuser';
export const GET_USER_TASK_LIST_BY_PROJECT = 'task/getUserTaskListByProject';
export const GET_TASK_USERS_LIST = 'task/gettaskuserslist';
export const NEW_TASK_USER = 'task/newtaskuser';
export const TASKLIST_BY_TEAM = 'task/tasklistbyteam';
export const CREATE_NEW_TASK = 'task/newtask';


// RealTime API's
export const GET_LOGIN_USERS = 'timelogs/getLogInUsers';
export const SET_LIVE_TRACKING = 'liveTracking/setLiveTrackingByUser';
export const REMOVE_LIVE_TRACKING = 'liveTracking/removeUserFromLiveTracking';

// Employees API's
export const GET_ROLES = 'auth/roles';
export const GET_ROLE = 'auth/role';

// ManualTime API's
export const GET_USER_MANAGERS = 'users/getUserManagers';
export const GET_USER_PROJECTS = 'users/getUserProjects';
export const GET_MANUAL_TIME_REQUESTS = 'manualTime/getManualTimeRequests';
export const ADD_MANUAL_TIME_REQUEST = 'manualTime/addManualTimeRequest';

// Team Members API's
export const ADD_SUBORDINATE = 'auth/roles/addSubordinate';
export const DELETE_SUBORDINATE = 'auth/roles/deleteSubordinate';

// Tags API's
export const GET_TAGS = 'task/tags';

// Email Template API's
export const EMAIL_TEMPLATES = 'common/emailTemplates';

// Timesheet API's
export const GET_TIMESHEET = 'timelogs/timesheet';

// Report API's
export const GET_ATTENDANCE = 'report/getattandance';
export const GET_ACTIVITY = 'report/getactivity';
export const GET_TIMELINE = 'report/gettimeline';
export const GET_APP_WEBSITE = 'report/getappwebsite';
export const GET_LEAVES = 'report/getleaves';
export const GET_PRODUCTIVITY = 'report/getproductivity';

// Browser History
export const GET_BROWSER_HISTORY = 'appWebsite/browser-history';

// Common
export const GET_GOOGLE_API_KEY = 'common/GoogleApiKey';

// User Location
export const USER_LOCATION_API_URL = 'settings/user-location';
export const USER_LOCATIONS_API_URL = 'settings/user-locations';

// User CheckInCheckOut
export const USER_CHECKIN_URL = 'timelogs/userCheckin';
export const USER_CHECKOUT_URL = 'timelogs/userCheckOut';

// Approvals
export const MANUAL_TIME_REQUEST_FOR_APPROVAL = 'manualTime/getManualTimeRequestsForApproval';
export const UPDATE_MANUAL_TIME_REQUEST = 'manualTime/updateManualTimeRequest';

// Productivity Settings
export const GET_PRODUCTIVITY_APPS = 'appWebsite/productivity/apps';
export const UPDATE_PRODUCTIVITY_APP = 'appWebsite/productivity';

// Expense Management
export const POST_EXPENSE_CATEGORIES = 'expense/expense-categories';
export const GET_ALL_EXPENSE_CATEGORIES = 'expense/expense-categories';
export const GET_EXPENSE_CATEGORIES = 'expense/expense-categories';
export const PUT_EXPENSE_CATEGORIES = 'expense/expense-categories';
export const DELETE_EXPENSE_CATEGORIES = 'expense/expense-categories';
export const GET_EXPENSE_CATEGORIES_BY_EMPLOYEE = 'expense/expense-categories-by-employee';
export const POST_EXPENSE_APPLICATION_FIELDS = 'expense/expense-application-fields';
export const PUT_EXPENSE_APPLICATION_FIELDS = 'expense/expense-application-fields';
export const GET_EXPENSE_APPLICATION_FIELDS_BY_EXPENSE_CATEGORY = 'expense/expense-application-fields-by-expense-category';
export const DELETE_EXPENSE_APPLICATION_FIELDS = 'expense/expense-application-fields';
export const GET_EXPENSE_APPLICATION_FIELDS = 'expense/expense-application-field-values-by-field';
export const EXPENSE_APPLICATION_FIELDS = 'expense/expense-application-field-values';
export const POST_EXPENSE_TEMPLATES = 'expense/expense-templates';
export const GET_ALL_EXPENSE_TEMPLATES = 'expense/expense-templates';
export const GET_EXPENSE_TEMPLATES = 'expense/expense-templates';
export const PUT_EXPENSE_TEMPLATES = 'expense/expense-templates';
export const DELETE_EXPENSE_TEMPLATES = 'expense/expense-templates';
export const POST_EXPENSE_TEMPLATE_APPLICABLE_CATEGORIES = 'expense/expense-template-applicable-categories';
export const GET_EXPENSE_TEMPLATE_APPLICABLE_CATEGORIES = 'expense/expense-template-applicable-categories';
export const GET_EXPENSE_TEMPLATE_APPLICABLE_CATEGORIES_BY_TEMPLATE = 'expense/expense-template-applicable-categories-by-template';
export const GET_ALL_EMPLOYEE_EXPENSE_ASSIGNMENTS = 'expense/employee-expense-assignments';
export const GET_EMPLOYEE_EXPENSE_ASSIGNMENTS = 'expense/employee-expense-assignments';
export const GET_EMPLOYEE_EXPENSE_ASSIGNMENTS_BY_USER = 'expense/employee-expense-assignments-by-user';
export const DELETE_EMPLOYEE_EXPENSE_ASSIGNMENTS = 'expense/employee-expense-assignments';
export const POST_EXPENSE_REPORTS = 'expense/expense-reports';
export const GET_ALL_EXPENSE_REPORTS = 'expense/expense-reports';
export const GET_EXPENSE_REPORTS = 'expense/expense-reports';
export const PUT_EXPENSE_REPORTS = 'expense/expense-reports';
export const DELETE_EXPENSE_REPORTS = 'expense/expense-reports';
export const POST_EXPENSE_REPORT_EXPENSES = 'expense/expenseReportExpenses';
export const GET_ALL_EXPENSE_REPORT_EXPENSES = 'expense/expenseReportExpenses';
export const GET_EXPENSE_REPORT_EXPENSES = 'expense/expenseReportExpenses';
export const PUT_EXPENSE_REPORT_EXPENSES = 'expense/expenseReportExpenses';
export const DELETE_EXPENSE_REPORT_EXPENSES = 'expense/expenseReportExpenses';

// Interview Process
export const GET_ALL_APPLICATION_STATUS = 'interviews/application-status';
export const POST_APPLICATION_STATUS = 'interviews/application-status';
export const PUT_APPLICATION_STATUS = 'interviews/application-status';
export const DELETE_APPLICATION_STATUS = 'interviews/application-status';
export const GET_ALL_CANDIDATES_DATA_FIELDS = 'interviews/candidate-data-fields';
export const POST_CANDIDATES_DATA_FIELDS = 'interviews/candidate-data-fields';
export const PUT_CANDIDATES_DATA_FIELDS = 'interviews/candidate-data-fields';
export const DELETE_CANDIDATES_DATA_FIELDS = 'interviews/candidate-data-fields';
export const GET_ALL_CANDIDATES = 'interviews/candidates';
export const POST_CANDIDATES = 'interviews/candidates';
export const PUT_CANDIDATES = 'interviews/candidates';
export const DELETE_CANDIDATES = 'interviews/candidates';
export const GET_ALL_CANDIDATES_WITH_DATA = 'interviews/candidatesWithData';
export const GET_ALL_CANDIDATES_DATA_FIELD_VALUES = 'interviews/candidate-data-field-values';
export const POST_CANDIDATES_DATA_FIELD_VALUES = 'interviews/candidate-data-field-values';
export const PUT_CANDIDATES_DATA_FIELD_VALUES = 'interviews/candidate-data-field-values';
export const DELETE_CANDIDATES_DATA_FIELD_VALUES = 'interviews/candidate-data-field-values';
export const GET_ALL_FEEDBACK_FIELDS = 'interviews/feedback-fields';
export const POST_FEEDBACK_FIELD = 'interviews/feedback-fields';
export const PUT_FEEDBACK_FIELD = 'interviews/feedback-fields';
export const DELETE_FEEDBACK_FIELD = 'interviews/feedback-fields';
export const GET_ALL_FEEDBACK_FIELD_VALUES = 'interviews/feedback-field-values';
export const POST_FEEDBACK_FIELD_VALUES = 'interviews/feedback-field-values';
export const PUT_FEEDBACK_FIELD_VALUES = 'interviews/feedback-field-values';
export const DELETE_FEEDBACK_FIELD_VALUES = 'interviews/feedback-field-values';
export const GET_ALL_CANDIDATE_STATUS = 'interviews/candidate-application-status';
export const POST_CANDIDATE_STATUS = 'interviews/candidate-application-status';
export const PUT_CANDIDATE_STATUS = 'interviews/candidate-application-status';
export const DELETE_CANDIDATE_STATUS = 'interviews/candidate-application-status';
export const GET_ALL_CANDIDATE_INTERVIEWS = 'interviews/candidate-interview-details';
export const POST_CANDIDATE_INTERVIEWS = 'interviews/candidate-interview-details';
export const PUT_CANDIDATE_INTERVIEWS = 'interviews/candidate-interview-details';
export const DELETE_CANDIDATE_INTERVIEWS = 'interviews/candidate-interview-details';

// Storage Keys
export const STORAGE_TOKEN_KEY = 'AuthorizeToken';
export const STORAGE_USER_INFO = 'UserInfo';
export const STORAGE_EMAIL = 'Email';
export const STORAGE_PASSWORD = 'Password';
export const STORAGE_IS_REMEMBER = 'IsRemember';

// Email validation
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};
