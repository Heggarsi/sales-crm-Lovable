# 1. Test Health
Write-Host "Testing Health Check..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET

# 2. Login
Write-Host "`nTesting Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser@salescrm.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
Write-Host "Login Success!" -ForegroundColor Green
$token = $loginResponse.data.accessToken

# 👉 Display JWT Token
Write-Host "`nJWT Token:" -ForegroundColor Cyan
Write-Host $token -ForegroundColor White

# 3. Get Current User
Write-Host "`nTesting Get Current User..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}
$userResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method GET -Headers $headers
Write-Host "User Profile Retrieved!" -ForegroundColor Green
$userResponse.data | Format-List

# 4. Get All Roles
Write-Host "`nTesting Get All Roles..." -ForegroundColor Yellow
$rolesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/users/roles" -Method GET -Headers $headers
Write-Host "Roles Retrieved!" -ForegroundColor Green
$rolesResponse.data | Format-Table

Write-Host "`nAll Tests Passed! ✅" -ForegroundColor Green





# ------------------------------------------Lead Management----------------------------------------------
#needed - getall lead+businessinfo for leadqualification, MOM Report etc. leadqualification is done in service layer not using Leadqualification model.
# 5. Get Lead Sources
# Write-Host "`nTesting Get Lead Sources..." -ForegroundColor Yellow
# $leadSourcesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/leads/sources" -Method GET -Headers $headers
# Write-Host "Lead Sources Retrieved!" -ForegroundColor Green
# $leadSourcesResponse.data | Format-Table

# # 7. Get Lead Types
# Write-Host "`nTesting Get Lead Types..." -ForegroundColor Yellow
# $leadTypesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/leads/types" -Method GET -Headers $headers
# $leadTypesResponse.data | Format-Table

# # 8. Get Lead Statuses
# Write-Host "`nTesting Get Lead Statuses..." -ForegroundColor Yellow
# $leadStatusesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/leads/statuses" -Method GET -Headers $headers
# $leadStatusesResponse.data | Format-Table

# # 9. Get Qualification Statuses
# Write-Host "`nTesting Get Qualification Statuses..." -ForegroundColor Yellow
# $leadQStatusesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/leads/Qstatuses" -Method GET -Headers $headers
# $leadQStatusesResponse.data | Format-Table

# 10. Create Lead
# Write-Host "`nTesting Create Lead..." -ForegroundColor Yellow

# $createLeadBody = @{
#     CustomerName = "brony Doe"
#     Email = "brony.doe@test.com"
#     Phone = "9876943820"
#     AlternatePhone = "9123456789"
#     CompanyName = "Test Company Pvt Ltd"
#     Industry = "IT Services"
#     Designation = "Manager"
#     Country = "India"
#     State = "Karnataka"
#     City = "Bangalore"
#     Address = "MG Road, Bangalore"
#     SourceId = 1
#     LeadTypeId = 1
#     AssignedToUserId = 1
#     AssignedBy = 1
#     LeadStatusId = 1
#     CreatedBy = 1
# } | ConvertTo-Json

# $createLeadResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/leads" `
#   -Method POST `
#   -Headers $headers `
#   -Body $createLeadBody `
#   -ContentType "application/json"

# Write-Host "Lead Created Successfully! ✅" -ForegroundColor Green
# $createLeadResponse.data | Format-List

# # 6. Get All Leads
# Write-Host "`nTesting Get All Leads..." -ForegroundColor Yellow
# $allLeadsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/leads" -Method GET -Headers $headers
# Write-Host "All Leads Retrieved!" -ForegroundColor Green
# $allLeadsResponse.data | Format-Table

# # 11. Get Lead By ID
# Write-Host "`nTesting Get Lead By ID..." -ForegroundColor Yellow

# $leadId = 2   # use an existing LeadId from DB

# $getLeadByIdResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/leads/$leadId" `
#   -Method GET `
#   -Headers $headers

# Write-Host "Lead Retrieved Successfully! ✅" -ForegroundColor Green
# $getLeadByIdResponse.data | Format-List

# # 12. Update Lead
# Write-Host "`nTesting Update Lead..." -ForegroundColor Yellow

# $leadId = 2   # existing LeadId

# $updateBody = @{
#     CustomerName = "Updated Customer Name"
#     Phone = "9999999999"
#     CompanyName = "Updated Company Pvt Ltd"
# } | ConvertTo-Json

# $updateLeadResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/leads/$leadId" `
#   -Method PUT `
#   -Headers $headers `
#   -Body $updateBody `
#   -ContentType "application/json"

# Write-Host "Lead Updated Successfully! ✅" -ForegroundColor Green
# $updateLeadResponse.data | Format-List

# # 17. Delete Lead
# Write-Host "`nTesting Delete Lead..." -ForegroundColor Yellow

# $leadIdToDelete = 3  # existing LeadId

# $deleteResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/leads/$leadIdToDelete" `
#   -Method DELETE `
#   -Headers $headers

# Write-Host "Lead Deleted! ✅" -ForegroundColor Green
# $deleteResponse | Format-List


# # 13. Add / Update Lead Business Info
# Write-Host "`nTesting Add/Update Lead Business Info..." -ForegroundColor Yellow

# $leadId = 16   # existing LeadId

# $businessInfoBody = @{
#     Budget = 50000
#     BudgetCurrency = "INR"
#     BudgetRange = "40k-60k"
#     Timeline = "3 months"
#     Authority = "CTO"
#     NeedSummary = "CRM system for sales team"
#     Competition = "Zoho, HubSpot"
#     CurrentSolution = "Excel"
#     KeyStakeholders = "CTO, Sales Manager"
#     CapturedByUserId = 1
# } | ConvertTo-Json

# $businessInfoResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/leads/$leadId/business-info" `
#   -Method POST `
#   -Headers $headers `
#   -Body $businessInfoBody `
#   -ContentType "application/json"

# Write-Host "Business Info Saved Successfully! ✅" -ForegroundColor Green
# $businessInfoResponse.data | Format-List

# # 14. Get Lead Qualification Details
# Write-Host "`nTesting Get Lead Qualification Details..." -ForegroundColor Yellow

# $leadId = 2   # existing LeadId

# $qualificationDetailsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/leads/$leadId/qualification-details" `
#   -Method GET `
#   -Headers $headers

# Write-Host "Qualification Details Retrieved! ✅" -ForegroundColor Green
# $qualificationDetailsResponse.data | Format-List

# # 15. Accept Lead Qualification
# Write-Host "`nTesting Accept Lead Qualification..." -ForegroundColor Yellow

# $leadId = 16   # existing LeadId

# $acceptQualificationBody = @{
#     RequirementSummary = "Need full CRM with reporting"
#     PainPoints = "Manual tracking, no visibility"
#     DecisionTimeframe = "2 months"
#     CompetitorAnalysis = "Zoho, Freshsales"
# } | ConvertTo-Json

# $acceptQualificationResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/leads/$leadId/qualify/accept" `
#   -Method POST `
#   -Headers $headers `
#   -Body $acceptQualificationBody `
#   -ContentType "application/json"

# Write-Host "Lead Qualified Successfully! ✅" -ForegroundColor Green
# $acceptQualificationResponse.data | Format-List

# # 16. Send Introduction Email
# Write-Host "`nTesting Send Introduction Email..." -ForegroundColor Yellow

# $leadId = 2  # existing LeadId

# $sendEmailResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/leads/$leadId/send-intro-email" `
#   -Method POST `
#   -Headers $headers

# Write-Host "Introduction Email Triggered! ✅" -ForegroundColor Green
# $sendEmailResponse | Format-List

# ------------------------------------------Appointment Management----------------------------------------------
# needed - automatic appointment scheduler for all new leads. dont allow update meeting for same time(prevtime).
# should not allow change status = complete before the scheduled meeting date, in prod. should allow reshedule meeting which already in reshedule status.
# should not show completed and cancelled appointments for the leadID.
# Get Appointment Statuses
# Write-Host "`nTesting Get Appointment Statuses..." -ForegroundColor Yellow

# $appointmentStatusesResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/appointments/statuses" `
#   -Method GET `
#   -Headers $headers

# Write-Host "Appointment Statuses Retrieved!" -ForegroundColor Green
# $appointmentStatusesResponse.data | Format-Table

# # Create Appointment
# Write-Host "`nTesting Create Appointment..." -ForegroundColor Yellow

# $createAppointmentBody = @{
#     LeadId = 2
#     Title = "Initial Sales Meeting 2"
#     MeetingDate = "2026-01-31"
#     Duration = 60
#     Mode = "Online"
#     Location = "Google Meet"
#     Agenda = "Discuss requirements and pricing"
#     AttendeesList = @(
#         "john@test.com",
#         "manager@test.com"
#     )
#     AppointmentStatusId = 1
#     CreatedByUserId = 1
# } | ConvertTo-Json

# $createAppointmentResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/appointments" `
#   -Method POST `
#   -Headers $headers `
#   -Body $createAppointmentBody `
#   -ContentType "application/json"

# Write-Host "Appointment Created Successfully! ✅" -ForegroundColor Green
# $createAppointmentResponse.data | Format-List

# # Get All Appointments
# Write-Host "`nTesting Get All Appointments..." -ForegroundColor Yellow

# $getAllAppointmentsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/appointments" `
#   -Method GET `
#   -Headers $headers

# Write-Host "All Appointments Retrieved! ✅" -ForegroundColor Green
# $getAllAppointmentsResponse.data | Format-Table

# # Update Appointment
# Write-Host "`nTesting Update Appointment..." -ForegroundColor Yellow
# $meetingDate = ([datetime]"2026-02-01T19:30:00Z").ToString("yyyy-MM-dd HH:mm:ss")

# $updateAppointmentBody = @{
#     Title = "Updated Sales Meeting"
#     MeetingDate = $meetingDate
#     Duration = 90
#     Mode = "Offline"
#     Location = "Company HQ, Meeting Room 1"
#     Agenda = "Discuss updated project scope"
#     AttendeesList = @(
#         "john@test.com",
#         "manager@test.com"
#     )
# } | ConvertTo-Json -Depth 5

# $appointmentId = 6  # Replace with the actual appointment ID you want to update

# $updateAppointmentResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/appointments/$appointmentId" `
#   -Method PUT `
#   -Headers $headers `
#   -Body $updateAppointmentBody `
#   -ContentType "application/json"

# Write-Host "Appointment Updated Successfully! ✅" -ForegroundColor Green
# $updateAppointmentResponse.data | Format-List

# # Cancel Appointment
# Write-Host "`nTesting Cancel Appointment..." -ForegroundColor Yellow

# $appointmentId = 6  # Replace with the actual appointment ID you want to cancel

# $cancelAppointmentBody = @{
#     reason = "Client requested reschedule"
# } | ConvertTo-Json

# $cancelAppointmentResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/appointments/$appointmentId/cancel" `
#   -Method POST `
#   -Headers $headers `
#   -Body $cancelAppointmentBody `
#   -ContentType "application/json"

# Write-Host "Appointment Cancelled Successfully! ✅" -ForegroundColor Green
# $cancelAppointmentResponse.data | Format-List

# # Complete Appointment
# Write-Host "`nTesting Complete Appointment..." -ForegroundColor Yellow

# $appointmentId = 3  # Replace with the actual appointment ID you want to complete

# $completeAppointmentBody = @{
#     notes = "Discussed all project requirements and next steps."
#     outcome = "Successful"
# } | ConvertTo-Json

# $completeAppointmentResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/appointments/$appointmentId/complete" `
#   -Method POST `
#   -Headers $headers `
#   -Body $completeAppointmentBody `
#   -ContentType "application/json"

# Write-Host "Appointment Completed Successfully! ✅" -ForegroundColor Green
# $completeAppointmentResponse.data | Format-List

# # Reschedule Appointment
# Write-Host "`nTesting Reschedule Appointment..." -ForegroundColor Yellow

# $appointmentId = 7  # Replace with the actual appointment ID

# # MySQL-friendly datetime (no T, no Z)
# $newDate = ([datetime]"2026-02-05T10:30:00Z").ToString("yyyy-MM-dd HH:mm:ss")

# $rescheduleAppointmentBody = @{
#     newDate = $newDate
#     reason = "Client requested a later time"
# } | ConvertTo-Json

# $rescheduleAppointmentResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/appointments/$appointmentId/reschedule" `
#   -Method POST `
#   -Headers $headers `
#   -Body $rescheduleAppointmentBody `
#   -ContentType "application/json"

# Write-Host "Appointment Rescheduled Successfully! ✅" -ForegroundColor Green
# $rescheduleAppointmentResponse.data | Format-List

# # Get Appointments by Lead
# Write-Host "`nTesting Get Appointments by Lead..." -ForegroundColor Yellow

# $leadId = 2  # Replace with an existing Lead ID

# $getAppointmentsByLeadResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/appointments/lead/$leadId" `
#   -Method GET `
#   -Headers $headers

# Write-Host "Appointments for Lead Retrieved! ✅" -ForegroundColor Green
# $getAppointmentsByLeadResponse.data | Format-Table

# ------------------------------------------MOM Management----------------------------------------------
# Create MOM (VALID according to your validator)
# Write-Host "`nTesting Create MOM..." -ForegroundColor Yellow

# # ISO8601 for validator, then MySQL-friendly
# $meetingDate = ([datetime]"2026-02-01T10:00:00Z").ToString("yyyy-MM-ddTHH:mm:ss")
# $followUpDate = ([datetime]"2026-02-10T10:00:00Z").ToString("yyyy-MM-ddTHH:mm:ss")

# $createMOMBody = @{
#     AppointmentId = 3
#     LeadId = 2
#     MeetingDate = $meetingDate
#     Attendees = "john@test.com, manager@test.com, sales@test.com"
#     DiscussionPoints = "Discussed project scope, timeline, pricing and delivery model."
#     Decisions = "Proceed with Phase 1."
#     ActionItems = "Send proposal and schedule demo."
#     NextSteps = "Client to confirm by next week."
#     FollowUpDate = $followUpDate
#     ClientFeedback = "Very positive."
#     InternalNotes = "High priority lead."
#     Status = "Final"
# } | ConvertTo-Json

# $createMOMResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/mom" `
#   -Method POST `
#   -Headers $headers `
#   -Body $createMOMBody `
#   -ContentType "application/json"

# Write-Host "MOM Created Successfully! ✅" -ForegroundColor Green
# $createMOMResponse.data | Format-List

# # Get All MOMs
# Write-Host "`nTesting Get All MOMs..." -ForegroundColor Yellow

# $getAllMOMsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/mom" `
#   -Method GET `
#   -Headers $headers

# Write-Host "All MOMs Retrieved! ✅" -ForegroundColor Green
# $getAllMOMsResponse.data | Format-Table

# # Get MOM by ID
# Write-Host "`nTesting Get MOM by ID..." -ForegroundColor Yellow

# $momId = 1  # Replace with an existing MOM ID

# $getMOMByIdResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/mom/$momId" `
#   -Method GET `
#   -Headers $headers

# Write-Host "MOM Retrieved Successfully! ✅" -ForegroundColor Green
# $getMOMByIdResponse.data | Format-List

# # Update MOM
# Write-Host "`nTesting Update MOM..." -ForegroundColor Yellow

# $momId = 1  # Existing MOM ID

# # ISO8601 for validator (T is required, Z not needed)
# $meetingDate = ([datetime]"2026-02-03T11:00:00").ToString("yyyy-MM-ddTHH:mm:ss")
# $followUpDate = ([datetime]"2026-02-15T10:00:00").ToString("yyyy-MM-ddTHH:mm:ss")

# $updateMOMBody = @{
#     MeetingDate = $meetingDate
#     Attendees = "john@test.com, manager@test.com, sales@test.com"
#     DiscussionPoints = "Updated discussion: finalized pricing and delivery timeline."
#     Decisions = "Approved Phase 1 budget."
#     ActionItems = "Send final contract."
#     NextSteps = "Client onboarding."
#     FollowUpDate = $followUpDate
#     ClientFeedback = "Satisfied with proposal."
#     InternalNotes = "Move to closing stage."
#     Status = "Shared"
#     ReviewedByUserId = 1
# } | ConvertTo-Json

# $updateMOMResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/mom/$momId" `
#   -Method PUT `
#   -Headers $headers `
#   -Body $updateMOMBody `
#   -ContentType "application/json"

# Write-Host "MOM Updated Successfully! ✅" -ForegroundColor Green
# $updateMOMResponse.data | Format-List

# # Share MOM with Client
# Write-Host "`nTesting Share MOM with Client..." -ForegroundColor Yellow

# $momId = 1  # Existing MOM ID

# $shareMOMResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/mom/$momId/share" `
#   -Method POST `
#   -Headers $headers

# Write-Host "MOM Shared with Client Successfully! ✅" -ForegroundColor Green
# $shareMOMResponse.data | Format-List

# # Get MOM by Appointment
# Write-Host "`nTesting Get MOM by Appointment..." -ForegroundColor Yellow

# $appointmentId = 3  # Existing Appointment ID

# $getMOMByAppointmentResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/mom/appointment/$appointmentId" `
#   -Method GET `
#   -Headers $headers

# Write-Host "MOM for Appointment Retrieved! ✅" -ForegroundColor Green
# $getMOMByAppointmentResponse.data | Format-List

# # Get MOMs by Lead
# Write-Host "`nTesting Get MOMs by Lead..." -ForegroundColor Yellow

# $leadId = 2  # Existing Lead ID

# $getMOMsByLeadResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/mom/lead/$leadId" `
#   -Method GET `
#   -Headers $headers

# Write-Host "MOMs for Lead Retrieved! ✅" -ForegroundColor Green
# $getMOMsByLeadResponse.data | Format-Table

# -------------------- OPPORTUNITY MODULE TESTS --------------------------------------------------------------
# # Get Opportunity Stages
# Write-Host "`nTesting Get Opportunity Stages..." -ForegroundColor Yellow

# $stagesResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/stages" `
#   -Method GET `
#   -Headers $headers

# Write-Host "Opportunity Stages Retrieved! ✅" -ForegroundColor Green
# $stagesResponse.data | Format-Table

# # Get Opportunity Statuses
# Write-Host "`nTesting Get Opportunity Statuses..." -ForegroundColor Yellow

# $statusesResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/statuses" `
#   -Method GET `
#   -Headers $headers

# Write-Host "Opportunity Statuses Retrieved! ✅" -ForegroundColor Green
# $statusesResponse.data | Format-Table

# # Get Qualified Leads Without Opportunities (Bulk Creation Preview)
# Write-Host "`nTesting Qualified Leads Without Opportunities..." -ForegroundColor Yellow

# $qualifiedLeadsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/qualified-leads-without-opportunity" `
#   -Method GET `
#   -Headers $headers

# Write-Host "Qualified Leads Retrieved Successfully! ✅" -ForegroundColor Green
# # Show count
# Write-Host "`nTotal Qualified Leads:" -ForegroundColor Cyan `
#   $qualifiedLeadsResponse.count

# $qualifiedLeadsResponse.data | Format-Table `
#   $response.data | Format-Table `
  
#   # -------------------------------
# # Test: Get Opportunity Pipeline
# # -------------------------------
# Write-Host "`nTesting Opportunity Pipeline..." -ForegroundColor Yellow

# $pipelineResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/pipeline" `
#   -Method GET `
#   -Headers $headers

# # Show count (if returned)
# if ($pipelineResponse.count -ne $null) {
#   Write-Host "Total Pipeline Records:" $pipelineResponse.count -ForegroundColor Cyan
# }

# # Show pipeline data
# $pipelineResponse.data | Format-Table

# # -------------------------------
# # Test: Get Opportunity Forecast
# # -------------------------------
# Write-Host "`nTesting Opportunity Forecast..." -ForegroundColor Yellow

# $forecastResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/forecast" `
#   -Method GET `
#   -Headers $headers

# # Show summary values
# Write-Host "Forecast Summary:" -ForegroundColor Cyan
# $forecastResponse | Format-List

# # ---------------------------------------
# # Test: Generate Opportunity Report
# # ---------------------------------------
# Write-Host "`nTesting Opportunity Report..." -ForegroundColor Yellow

# $reportResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/report" `
#   -Method GET `
#   -Headers $headers

# # Show report metadata (if any)
# if ($reportResponse.count -ne $null) {
#   Write-Host "Total Records in Report:" $reportResponse.count -ForegroundColor Cyan
# }

# # Show report data
# $reportResponse.data | Format-Table

# # ----------------------------------
# # Test: Create Opportunity
# # ----------------------------------
# Write-Host "`nTesting Create Opportunity..." -ForegroundColor Yellow

# $createOpportunityBody = @{
#     LeadId               = 14
#     OpportunityName      = "CRM Implementation for ABC Corp"
#     Description          = "Full CRM setup including sales pipeline and reporting"
#     EstimatedValue       = 250000
#     Currency             = "INR"
#     Probability          = 70
#     ExpectedCloseDate    = "2026-03-15"
#     CompetitorInfo       = "Zoho CRM, Salesforce"
#     KeyDecisionMakers    = "CTO, Sales Head"
#     OpportunityStageId   = 3
#     OpportunityStatusId  = 1
#     CreatedByUserId      = 5
# } | ConvertTo-Json -Depth 5

# $response = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities" `
#   -Method POST `
#   -Headers $headers `
#   -Body $createOpportunityBody `
#   -ContentType "application/json"

# # Show created opportunity
# Write-Host "Opportunity Created Successfully!" -ForegroundColor Green
# $response | Format-List

# # ----------------------------------
# # ----------------------------------
# # Test: Get All Opportunities
# # ----------------------------------
# Write-Host "`nTesting Get All Opportunities..." -ForegroundColor Yellow

# $getOpportunitiesResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities" `
#   -Method GET `
#   -Headers $headers

# # Show total count (if returned)
# if ($getOpportunitiesResponse.count -ne $null) {
#     Write-Host "Total Opportunities:" $getOpportunitiesResponse.count -ForegroundColor Cyan
# }

# # Show opportunity data
# $getOpportunitiesResponse.data | Format-Table `
  


# # ----------------------------------
# # Test: Get Opportunity by ID
# # ----------------------------------
# Write-Host "`nTesting Get Opportunity By ID..." -ForegroundColor Yellow

# $opportunityId = 2   # change to valid ID

# $response = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/$opportunityId" `
#   -Method GET `
#   -Headers $headers

# # Show single opportunity
# $response.data | Format-List

# # ----------------------------------
# # Test: Update Opportunity
# # ----------------------------------
# Write-Host "`nTesting Update Opportunity..." -ForegroundColor Yellow

# $opportunityId = 1  # Replace with an existing Opportunity ID

# $updateOpportunityBody = @{
#     OpportunityName      = "Updated CRM Implementation for ABC Corp"
#     Description          = "Updated description with refined scope and deliverables"
#     EstimatedValue       = 275000
#     Probability          = 80
#     ExpectedCloseDate    = "2026-03-30"
#     CompetitorInfo       = "Zoho CRM, Salesforce, Freshworks"
#     KeyDecisionMakers    = "CTO, Sales Head, CEO"
#     OpportunityStageId   = 4
#     OpportunityStatusId  = 1
# } | ConvertTo-Json -Depth 5

# $updateOpportunityResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/$opportunityId" `
#   -Method PUT `
#   -Headers $headers `
#   -Body $updateOpportunityBody `
#   -ContentType "application/json"

# Write-Host "Opportunity Updated Successfully! ✅" -ForegroundColor Green
# $updateOpportunityResponse | Format-List

# # ----------------------------------
# # Test: Update Opportunity Stage
# # ----------------------------------
# Write-Host "`nTesting Update Opportunity Stage..." -ForegroundColor Yellow

# $opportunityId = 4  # Existing Opportunity ID
# $stageId = 3        # New stage (1-6 according to validator)

# $updateStageBody = @{
#     stageId = $stageId
# } | ConvertTo-Json

# $updateStageResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/$opportunityId/stage" `
#   -Method PUT `
#   -Headers $headers `
#   -Body $updateStageBody `
#   -ContentType "application/json"

# Write-Host "Opportunity Stage Updated Successfully! ✅" -ForegroundColor Green
# $updateStageResponse | Format-List

# # ----------------------------------
# # Test: Win Opportunity
# # ----------------------------------
# Write-Host "`nTesting Win Opportunity..." -ForegroundColor Yellow

# $opportunityId = 1  # Existing Opportunity ID

# $winOpportunityBody = @{
#     notes = "Opportunity successfully closed and contract signed."  # Optional
# } | ConvertTo-Json

# $winOpportunityResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/$opportunityId/win" `
#   -Method POST `
#   -Headers $headers `
#   -Body $winOpportunityBody `
#   -ContentType "application/json"

# Write-Host "Opportunity Marked as Won! ✅" -ForegroundColor Green
# $winOpportunityResponse | Format-List

# ----------------------------------
# Test: Lose Opportunity
# ----------------------------------
# Write-Host "`nTesting Lose Opportunity..." -ForegroundColor Yellow

# $opportunityId = 2  # Existing Opportunity ID

# $loseOpportunityBody = @{
#     LostReason               = "Lost to competitor"         # Required
#     DetailedReason           = "Competitor offered better pricing and faster delivery."
#     CompetitorName           = "XYZ Corp"
#     CompetitorPrice          = 240000
#     LostToCompetitor         = $true
#     ClientFeedback           = "Interested but budget limited."
#     LessonsLearned           = "Need to offer faster turnaround and flexible pricing."
#     FollowUpPlan             = "Re-engage in 6 months with updated proposal."
#     PotentialFutureOpportunity = $true
#     RevisitDate              = "2026-08-01"
# } | ConvertTo-Json -Depth 5

# $loseOpportunityResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/$opportunityId/lose" `
#   -Method POST `
#   -Headers $headers `
#   -Body $loseOpportunityBody `
#   -ContentType "application/json"

# Write-Host "Opportunity Marked as Lost! ✅" -ForegroundColor Green
# $loseOpportunityResponse |  ConvertTo-Json -Depth 10

# # ----------------------------------
# # Test: Get Opportunities by Lead
# # ----------------------------------
# Write-Host "`nTesting Get Opportunities by Lead..." -ForegroundColor Yellow

# $leadId = 2   # Existing Lead ID

# $getOpportunitiesByLeadResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/lead/$leadId" `
#   -Method GET `
#   -Headers $headers

# Write-Host "Opportunities fetched successfully! ✅" -ForegroundColor Green

# # Show count + data
# Write-Host "Total Opportunities: $($getOpportunitiesByLeadResponse.count)" -ForegroundColor Cyan
# $getOpportunitiesByLeadResponse.data | Format-Table

# # ----------------------------------
# # Test: Bulk Create Opportunities from Qualified Leads
# # ----------------------------------
# Write-Host "`nTesting Bulk Create Opportunities from Qualified Leads..." -ForegroundColor Yellow

# $response = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/opportunities/bulk-create-from-qualified-leads" `
#   -Method POST `
#   -Headers $headers

# # Show raw JSON response
# $response | ConvertTo-Json -Depth 5

# --------------------  LOST OPPORTUNITY MODULE TESTS --------------------------------------------------------------
# ----------------------------------
# Test: Get Loss Reasons
# ----------------------------------
# Write-Host "`nTesting Get Loss Reasons..." -ForegroundColor Yellow

# $lossReasonsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/lost-opportunities/loss-reasons" `
#   -Method GET `
#   -Headers $headers

# $lossReasonsResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Get Loss Analysis
# # ----------------------------------
# Write-Host "`nTesting Get Loss Analysis..." -ForegroundColor Yellow

# $lossAnalysisResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/lost-opportunities/analysis" `
#   -Method GET `
#   -Headers $headers

# $lossAnalysisResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Get All Lost Opportunities
# # ----------------------------------
# Write-Host "`nTesting Get All Lost Opportunities..." -ForegroundColor Yellow

# $getAllLostOpportunitiesResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/lost-opportunities" `
#   -Method GET `
#   -Headers $headers

# # Show count + data
# Write-Host "Total Lost Opportunities: $($getAllLostOpportunitiesResponse.count)" -ForegroundColor Cyan
# $getAllLostOpportunitiesResponse.data | Format-Table

# # ----------------------------------
# # Test: Get Lost Opportunity by ID
# # ----------------------------------
# Write-Host "`nTesting Get Lost Opportunity by ID..." -ForegroundColor Yellow

# $lostOpportunityId = 12   # Existing Lost Opportunity ID

# $getLostOpportunityByIdResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/lost-opportunities/$lostOpportunityId" `
#   -Method GET `
#   -Headers $headers

# $getLostOpportunityByIdResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Update Lost Opportunity
# # ----------------------------------
# Write-Host "`nTesting Update Lost Opportunity..." -ForegroundColor Yellow

# $lostOpportunityId = 17   # Existing Lost Opportunity ID

# $updateLostOpportunityBody = @{
#     DetailedReason = "Customer selected competitor due to better long-term pricing"
#     LessonsLearned = "Need flexible pricing model for enterprise clients"
#     FollowUpPlan = "Revisit in next fiscal year"
#     PotentialFutureOpportunity = $true
#     RevisitDate = "2026-06-01"
# } | ConvertTo-Json

# $updateLostOpportunityResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/lost-opportunities/$lostOpportunityId" `
#   -Method PUT `
#   -Headers $headers `
#   -Body $updateLostOpportunityBody `
#   -ContentType "application/json"

# $updateLostOpportunityResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Get Lost Opportunity by Opportunity ID
# # ----------------------------------
# Write-Host "`nTesting Get Lost Opportunity by Opportunity ID..." -ForegroundColor Yellow

# $opportunityId = 3   # Existing Opportunity ID that is LOST

# $getLostOpportunityByOpportunityIdResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/lost-opportunities/opportunity/$opportunityId" `
#   -Method GET `
#   -Headers $headers

# $getLostOpportunityByOpportunityIdResponse | ConvertTo-Json -Depth 5

# ------------------------------------------Proposal Management----------------------------------------------
#neeeded-update method for proposalappointment, 
#chnges needed for create proposal when parentproposal comes in picture, 
#proposalappointment crud functionality/methodality has to be added,in proposal route endpoints file and service file
# ----------------------------------
# Test: Get Proposal Statuses
# ----------------------------------
# Write-Host "`nTesting Get Proposal Statuses..." -ForegroundColor Yellow

# $proposalStatusesResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/statuses" `
#   -Method GET `
#   -Headers $headers

# $proposalStatusesResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Get Proposal Rejection Reasons
# # ----------------------------------
# Write-Host "`nTesting Get Proposal Rejection Reasons..." -ForegroundColor Yellow

# $proposalRejectionReasonsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/rejection-reasons" `
#   -Method GET `
#   -Headers $headers

# $proposalRejectionReasonsResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Get Pending Proposal Approvals
# # ----------------------------------
# Write-Host "`nTesting Get Pending Proposal Approvals..." -ForegroundColor Yellow

# $pendingProposalApprovalsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/pending-approval" `
#   -Method GET `
#   -Headers $headers

# $pendingProposalApprovalsResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Create Proposal
# # ----------------------------------
# Write-Host "`nTesting Create Proposal..." -ForegroundColor Yellow

# $createProposalBody = @{
#     OpportunityId  = 4
#     ProposalTitle  = "CRM Implementation Proposal for ABC Corp"
#     ProposalAmount = 290000.00
#     Currency       = "INR"
#     ValidityDate = "2026-03-31 00:00:00"
#     PaymentTerms   = "50% upfront, 50% on completion"
#     DeliveryTerms  = "Delivery within 60 days from approval"
#     InternalNotes  = "High priority client, ensure fast approval"
# } | ConvertTo-Json

# $createProposalResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals" `
#   -Method POST `
#   -Headers $headers `
#   -Body $createProposalBody `
#   -ContentType "application/json"

# Write-Host "Proposal Created Successfully! ✅" -ForegroundColor Green
# $createProposalResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Get All Proposals
# # ----------------------------------
# Write-Host "`nTesting Get All Proposals..." -ForegroundColor Yellow

# $getAllProposalsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals" `
#   -Method GET `
#   -Headers $headers

# # Show count + data
# Write-Host "Total Proposals: $($getAllProposalsResponse.count)" -ForegroundColor Cyan
# $getAllProposalsResponse.data | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Get Proposal by ID
# # ----------------------------------
# Write-Host "`nTesting Get Proposal by ID..." -ForegroundColor Yellow

# $proposalId = 18   # Existing Proposal ID

# $getProposalByIdResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$proposalId" `
#   -Method GET `
#   -Headers $headers

# $getProposalByIdResponse | ConvertTo-Json -Depth 5

# ----------------------------------
# Test: Update Proposal
# ----------------------------------
# Write-Host "`nTesting Update Proposal..." -ForegroundColor Yellow

# $updateProposalId = 23   # Existing Proposal ID in Draft status

# $updateProposalBody = @{
#     ProposalTitle  = "Updated CRM Proposal for ABC Corp"
#     ProposalAmount = 290000
#     Currency       = "INR"
#     PaymentTerms   = "50% upfront, 50% on completion"
#     DeliveryTerms  = "Delivery in 60 days"
#     InternalNotes  = "Updated notes for approval"
# } | ConvertTo-Json

# $updateProposalResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$updateProposalId" `
#   -Method PUT `
#   -Headers $headers `
#   -Body $updateProposalBody `
#   -ContentType "application/json"

# $updateProposalResponse | ConvertTo-Json -Depth 5

# ----------------------------------
# Test: Delete Proposal
# ----------------------------------
# Write-Host "`nTesting Delete Proposal..." -ForegroundColor Yellow

# $deleteProposalId = 4   # Existing Proposal ID

# $deleteProposalResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$deleteProposalId" `
#   -Method DELETE `
#   -Headers $headers

# $deleteProposalResponse | ConvertTo-Json -Depth 5

# ----------------------------------
# Test: Get Expiring Proposals
# ----------------------------------
# Write-Host "`nTesting Get Expiring Proposals..." -ForegroundColor Yellow

# $getExpiringProposalsResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/expiring-soon" `
#   -Method GET `
#   -Headers $headers

# # Show count + data
# Write-Host "Expiring Proposals Count: $($getExpiringProposalsResponse.count)" -ForegroundColor Cyan
# $getExpiringProposalsResponse.data | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Generate Proposal Report
# # ----------------------------------
# Write-Host "`nTesting Generate Proposal Report..." -ForegroundColor Yellow

# $generateProposalReportResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/report" `
#   -Method GET `
#   -Headers $headers

# $generateProposalReportResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Upload Proposal Document (curl)
# # ----------------------------------
# Write-Host "`nUploading Proposal Document using curl..." -ForegroundColor Yellow

# $proposalId = 23
# $filePath = "D:\Cursor\sales-crm\test-files\sample-proposal.pdf"

# curl.exe -X POST "http://localhost:5000/api/proposals/$proposalId/upload-document" `
#   -H "Authorization: Bearer $token" `
#   -F "proposalDocument=@$filePath"

# # ----------------------------------
# # Test: Download Proposal Document
# # ----------------------------------
# Write-Host "`nTesting Download Proposal Document..." -ForegroundColor Yellow

# $proposalId = 23
# $outputFile = "D:\Cursor\sales-crm\downloads\proposal_$proposalId.pdf"

# Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$proposalId/download-document" `
#   -Method GET `
#   -Headers $headers `
#   -OutFile $outputFile

# Write-Host "Proposal document downloaded successfully ✅" -ForegroundColor Green
# Write-Host "Saved to: $outputFile" -ForegroundColor Cyan

# ----------------------------------
# Test: Submit Proposal
# ----------------------------------
# Write-Host "`nTesting Submit Proposal..." -ForegroundColor Yellow

# $submitProposalId = 23   # Existing Proposal ID (must be in Draft status)

# $submitProposalResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$submitProposalId/submit" `
#   -Method POST `
#   -Headers $headers

# $submitProposalResponse | ConvertTo-Json -Depth 5

# ----------------------------------
# Test: Approve Proposal
# ----------------------------------
# Write-Host "`nTesting Approve Proposal..." -ForegroundColor Yellow

# $approveProposalId = 23   # Existing Proposal ID (must be Pending Approval)

# $approveProposalResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$approveProposalId/approve" `
#   -Method POST `
#   -Headers $headers

# $approveProposalResponse | ConvertTo-Json -Depth 5

# ----------------------------------
# Test: Reject Proposal
# ----------------------------------
# Write-Host "`nTesting Reject Proposal..." -ForegroundColor Yellow

# $rejectProposalId = 23   # Existing Proposal ID (must be Pending Approval)

# $rejectProposalBody = @{
#     Reason = "Pricing too high"
#     DetailedFeedback = "Client felt the proposal exceeded their approved budget."
#     CompetitorWon = "XYZ Solutions"
# } | ConvertTo-Json

# $rejectProposalResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$rejectProposalId/reject" `
#   -Method POST `
#   -Headers $headers `
#   -Body $rejectProposalBody `
#   -ContentType "application/json"

# $rejectProposalResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Create Proposal Revision
# # ----------------------------------
# Write-Host "`nTesting Create Proposal Revision..." -ForegroundColor Yellow

# $revisionProposalId = 23   # Existing Proposal ID (must be Rejected)

# $createRevisionResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$revisionProposalId/create-revision" `
#   -Method POST `
#   -Headers $headers

# $createRevisionResponse | ConvertTo-Json -Depth 5

# # ----------------------------------
# # Test: Link Appointment to Proposal
# # ----------------------------------
# Write-Host "`nTesting Link Appointment to Proposal..." -ForegroundColor Yellow

# $proposalIdToLink    = 32   # Existing Proposal ID
# $appointmentIdToLink = 8   # Existing Appointment ID

# $linkAppointmentBody = @{
#     appointmentId = $appointmentIdToLink
# } | ConvertTo-Json

# $linkAppointmentResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/$proposalIdToLink/link-appointment" `
#   -Method POST `
#   -Headers $headers `
#   -Body $linkAppointmentBody `
#   -ContentType "application/json"

# $linkAppointmentResponse | ConvertTo-Json -Depth 5


# # ----------------------------------
# # Test: Get Proposals by Opportunity
# # ----------------------------------
# Write-Host "`nTesting Get Proposals by Opportunity..." -ForegroundColor Yellow

# $opportunityId = 4   # Existing Opportunity ID

# $getProposalsByOpportunityResponse = Invoke-RestMethod `
#   -Uri "http://localhost:5000/api/proposals/opportunity/$opportunityId" `
#   -Method GET `
#   -Headers $headers

# # Show count + data
# Write-Host "Total Proposals: $($getProposalsByOpportunityResponse.count)" -ForegroundColor Cyan
# $getProposalsByOpportunityResponse.data | Format-Table
