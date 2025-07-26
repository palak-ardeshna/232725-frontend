import { createBaseApi } from './createBaseApi.js';

const apiServiceNames = [
    'user', 'role', 'lead', 'contact', 'pipeline', 'stage', 'filter', 'proposal', 'designation', 'employee', 'department', 'teamMember', 'note', 'project', 'activity', 'holiday', 'leave', 'task', 'milestone', 'milestoneTask', 'followup', 'maintenance', 'attendance', 'companyDetails', 'reminder', 'setting', 'inquiry', 'company', 'plan', 'admin'
];

const apiServices = {};
const apiHooks = {};

apiServiceNames.forEach(name => {
    const entityName = name.charAt(0).toUpperCase() + name.slice(1);

    apiServices[`${name}Api`] = createBaseApi({
        reducerPath: `${name}Api`,
        baseEndpoint: name,
        tagType: entityName,
        extraEndpoints: (builder) => ({})
    });

    const api = apiServices[`${name}Api`];

    // Special case for companyDetails
    if (name === 'companyDetails') {
        apiHooks[`useGet${entityName}Query`] = api.useGetAllQuery;
        apiHooks[`useGet${entityName}Query`] = api.useGetByIdQuery;
        apiHooks[`useCreate${entityName}Mutation`] = api.useCreateMutation;
        apiHooks[`useUpdate${entityName}Mutation`] = api.useUpdateMutation;
        apiHooks[`useDelete${entityName}Mutation`] = api.useDeleteMutation;
    } else {
        apiHooks[`useGet${entityName}sQuery`] = api.useGetAllQuery;
        apiHooks[`useGet${entityName}Query`] = api.useGetByIdQuery;
        apiHooks[`useCreate${entityName}Mutation`] = api.useCreateMutation;
        apiHooks[`useUpdate${entityName}Mutation`] = api.useUpdateMutation;
        apiHooks[`useDelete${entityName}Mutation`] = api.useDeleteMutation;
    }
});

const contactApi = apiServices.contactApi;
if (contactApi) {
    apiHooks.useGetClientsQuery = (params) => contactApi.useGetAllQuery({ ...params, isClient: true });
    apiHooks.useGetClientQuery = contactApi.useGetByIdQuery;
    apiHooks.useCreateClientMutation = contactApi.useCreateMutation;
    apiHooks.useUpdateClientMutation = contactApi.useUpdateMutation;
    apiHooks.useDeleteClientMutation = contactApi.useDeleteMutation;
}

const userApi = apiServices.userApi;
const roleApi = apiServices.roleApi;
const leadApi = apiServices.leadApi;
const pipelineApi = apiServices.pipelineApi;
const stageApi = apiServices.stageApi;
const filterApi = apiServices.filterApi;
const proposalApi = apiServices.proposalApi;
const designationApi = apiServices.designationApi;
const employeeApi = apiServices.employeeApi;
const departmentApi = apiServices.departmentApi;
const teamMemberApi = apiServices.teamMemberApi;
const noteApi = apiServices.noteApi;
const projectApi = apiServices.projectApi;
const activityApi = apiServices.activityApi;
const holidayApi = apiServices.holidayApi;
const leaveApi = apiServices.leaveApi;
const taskApi = apiServices.taskApi;
const followupApi = apiServices.followupApi;
const milestoneApi = apiServices.milestoneApi;
const milestoneTaskApi = apiServices.milestoneTaskApi;
const maintenanceApi = apiServices.maintenanceApi;
const attendanceApi = apiServices.attendanceApi;
const companyDetailsApi = apiServices.companyDetailsApi;
const reminderApi = apiServices.reminderApi;
const settingApi = apiServices.settingApi;
const inquiryApi = apiServices.inquiryApi;
const companyApi = apiServices.companyApi;
const planApi = apiServices.planApi;
const adminApi = apiServices.adminApi;

export {
    apiServices,
    apiHooks,
    userApi,
    roleApi,
    leadApi,
    contactApi,
    pipelineApi,
    stageApi,
    filterApi,
    proposalApi,
    designationApi,
    employeeApi,
    departmentApi,
    teamMemberApi,
    noteApi,
    projectApi,
    activityApi,
    holidayApi,
    leaveApi,
    taskApi,
    followupApi,
    milestoneApi,
    milestoneTaskApi,
    maintenanceApi,
    attendanceApi,
    companyDetailsApi,
    reminderApi,
    settingApi,
    inquiryApi,
    companyApi,
    planApi,
    adminApi
};
