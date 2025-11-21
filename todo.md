Method Path Description
[] POST /auth/login Authenticate user and return token/session
[✅] POST /auth/logout Invalidate token/session
POST /auth/otp/send Send OTP (email/phone)
POST /auth/otp/verify Verify OTP
POST /auth/refresh-token Get a new access token via refresh token
PUT /auth/block/:id Block user
PUT /auth/unblock/:id Unblock user
PUT /auth/verify-email/:id Mark user email as verified
GET /auth/profile Fetch logged-in user’s profile
POST /auth/password/forgot Request password reset (send OTP/link)
POST /auth/password/reset Reset password using token/OTP
POST /auth/password/change Change password (authenticated user)
POST /auth/login/otp Log in with OTP only (no password)
POST /auth/verify/email Confirm email via token
POST /auth/verify/phone Confirm phone via OTP
POST /auth/resend-verification Resend email/phone verification
POST /auth/register Register new user
POST /auth/activate Activate user via token (email-based activation)

Menu Managment

    Method	Path	Description

[✅] GET /menus Get all menus (optionally paginated/filtered)
[✅] GET /menus/:id Get menu by ID
[✅] POST /menus Create a new menu
[✅] PUT /menus/:id Update menu by ID
[✅] DELETE /menus/:id Soft delete a menu
[✅] GET /menus/tree Get hierarchical/tree structure of menus
[✅] GET /menus/role/:roleId Get menus accessible to a specific role --role-menu-access/role/cmbyqmoue0002krfshx4q79td
[✅] POST /menus/reorder Update order/position of menus (drag-drop support) -- he will do by single update api
[] GET /menus/user/:userId Get menus for a specific user (post access mapping)

Roles

Method Path Description
[✅] GET /roles Get all roles (optionally paginated/filtered)
[✅] GET /roles/:id Get details of a specific role by ID
[✅] POST /roles Create a new role
[✅] PUT /roles/:id Update an existing role
[✅] DELETE /roles/:id Soft delete a role
[✅] POST /roles/:id/menus Assign menus to a role (menu access configuration)
[✅] GET /roles/:id/menus Get menus assigned to a role
[✅] POST /roles/:id/menu Assign menus to a role (bulk assignment)
[] POST assign user to specific role
[] GET /roles/user/:userId Get roles assigned to a specific user
[] POST /roles/:id/users Assign users to a role (bulk assignment)
[] DELETE /roles/:roleId/users/:userId Remove a user from a role

Currently Not aaplicable:
[] POST /roles/:id/apis Assign API access to a role (for route-level access)
[] GET /roles/:id/apis Get API access assigned to a role
[] GET /roles/tenant/:tenantId Get all roles for a specific tenant
[] GET /menus/tenant/:tenantId List menus for a specific tenant (if multitenant)

- JWT Enhancemnets
- HTTP Postman for hhtp client request
- Logger Enhancemnnet
- Validation Framework
- Testing Sample integration
- Add linter, prettier and requred files
- pdfHelper / excelHelper / templateHelper / notificationHelper /

  simfini --- simfini.com/sms/trigger?to=<mobile>&secID=<id>&text=<sms>&apikey="hhcgdf"
  topsms
  gsms
  smsindia
