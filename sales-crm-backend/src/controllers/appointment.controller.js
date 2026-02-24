const { asyncHandler } = require('../middlewares/errorHandler.middleware');
const AppointmentService = require('../services/appointmentService');
const { HTTP_STATUS } = require('../config/constants');

const AppointmentController = {
  // Create appointment
  createAppointment: asyncHandler(async (req, res) => {
    const appointment = await AppointmentService.createAppointment(req.body, req.user);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });
  }),

  // Get all appointments
  getAllAppointments: asyncHandler(async (req, res) => {
    const { page, limit, leadId, appointmentStatusId, fromDate, toDate, search } = req.query;

    const filters = {
      page: page || 1,
      limit: limit || 10,
      leadId,
      appointmentStatusId,
      fromDate,
      toDate,
      search
    };

    const result = await AppointmentService.getAllAppointments(filters, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appointments retrieved successfully',
      ...result
    });
  }),

  // Get appointment by ID
  getAppointmentById: asyncHandler(async (req, res) => {
    const appointment = await AppointmentService.getAppointmentById(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appointment retrieved successfully',
      data: appointment
    });
  }),

  // Update appointment
  updateAppointment: asyncHandler(async (req, res) => {
    const appointment = await AppointmentService.updateAppointment(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  }),

  // Delete appointment
  deleteAppointment: asyncHandler(async (req, res) => {
    await AppointmentService.deleteAppointment(req.params.id, req.user);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  }),

  // Cancel appointment
  cancelAppointment: asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const appointment = await AppointmentService.cancelAppointment(
      req.params.id,
      reason,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  }),

  // Complete appointment
  completeAppointment: asyncHandler(async (req, res) => {
    const result = await AppointmentService.completeAppointment(
      req.params.id,
      req.body,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: result.appointment
    });
  }),

  // Reschedule appointment
  rescheduleAppointment: asyncHandler(async (req, res) => {
    const { newDate, reason } = req.body;
    const appointment = await AppointmentService.rescheduleAppointment(
      req.params.id,
      newDate,
      reason,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });
  }),

  // Get appointments by lead
  getAppointmentsByLead: asyncHandler(async (req, res) => {
    const appointments = await AppointmentService.getAppointmentsByLead(
      req.params.leadId,
      req.user
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments
    });
  }),

  // Get appointment statuses
  getAppointmentStatuses: asyncHandler(async (req, res) => {
    const statuses = await AppointmentService.getAppointmentStatuses();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Appointment statuses retrieved successfully',
      data: statuses
    });
  })
};

module.exports = AppointmentController;