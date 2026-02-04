-- Migration: Add partner request email templates
-- Date: 2025-02-04
-- These templates were missing, preventing admin notifications

-- Template for new partner request (to notify admins)
INSERT INTO email_templates (slug, name, subject_fr, subject_en, body_fr, body_en, variables) VALUES
(
  'new_partner_request',
  'Nouvelle demande de partenaire DMC',
  '🆕 Nouvelle demande DMC : {{partner_name}}',
  '🆕 New DMC request: {{partner_name}}',
  E'Bonjour,\n\nUne nouvelle demande d''inscription DMC a été soumise.\n\n📋 **Informations du demandeur :**\n- Nom de la société : {{partner_name}}\n- Contact : {{contact_name}}\n- Email : {{contact_email}}\n- Site web : {{website}}\n- Destinations : {{destinations}}\n\n👉 **Action requise :**\nConnectez-vous à l''espace admin pour examiner cette demande :\n{{admin_url}}\n\nCordialement,\nLe système DMC Alliance',
  E'Hello,\n\nA new DMC registration request has been submitted.\n\n📋 **Applicant Information:**\n- Company name: {{partner_name}}\n- Contact: {{contact_name}}\n- Email: {{contact_email}}\n- Website: {{website}}\n- Destinations: {{destinations}}\n\n👉 **Action required:**\nLog in to the admin area to review this request:\n{{admin_url}}\n\nBest regards,\nThe DMC Alliance system',
  '["partner_name", "contact_name", "contact_email", "website", "destinations", "admin_url"]'
),
(
  'partner_request_approved',
  'Demande DMC approuvée',
  '✅ Bienvenue chez DMC Alliance, {{partner_name}} !',
  '✅ Welcome to DMC Alliance, {{partner_name}}!',
  E'Bonjour {{contact_name}},\n\n🎉 Félicitations ! Votre demande d''inscription à DMC Alliance a été approuvée.\n\nVotre compte partenaire "{{partner_name}}" est maintenant actif. Vous pouvez vous connecter à votre espace partenaire pour :\n\n- Créer et gérer vos circuits GIR\n- Suivre vos réservations\n- Gérer vos commissions\n\n👉 Connectez-vous ici : {{login_url}}\n\nL''équipe DMC Alliance vous souhaite la bienvenue et reste à votre disposition pour toute question.\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{contact_name}},\n\n🎉 Congratulations! Your DMC Alliance registration request has been approved.\n\nYour partner account "{{partner_name}}" is now active. You can log in to your partner area to:\n\n- Create and manage your GIR circuits\n- Track your bookings\n- Manage your commissions\n\n👉 Log in here: {{login_url}}\n\nThe DMC Alliance team welcomes you and remains available for any questions.\n\nBest regards,\nThe DMC Alliance Team',
  '["partner_name", "contact_name", "login_url"]'
),
(
  'partner_request_rejected',
  'Demande DMC non retenue',
  'DMC Alliance - Réponse à votre demande',
  'DMC Alliance - Response to your request',
  E'Bonjour {{contact_name}},\n\nNous avons examiné avec attention votre demande d''inscription à DMC Alliance pour "{{partner_name}}".\n\nAprès étude de votre dossier, nous ne sommes malheureusement pas en mesure de donner suite à votre demande pour le moment.\n\n{{rejection_reason}}\n\nN''hésitez pas à nous recontacter si votre situation évolue ou si vous avez des questions.\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{contact_name}},\n\nWe have carefully reviewed your DMC Alliance registration request for "{{partner_name}}".\n\nAfter reviewing your application, we are unfortunately unable to proceed with your request at this time.\n\n{{rejection_reason}}\n\nPlease feel free to contact us if your situation changes or if you have any questions.\n\nBest regards,\nThe DMC Alliance Team',
  '["partner_name", "contact_name", "rejection_reason"]'
),
(
  'agency_join_request',
  'Demande de rejoindre un DMC',
  '👤 Nouvelle demande pour rejoindre {{partner_name}}',
  '👤 New request to join {{partner_name}}',
  E'Bonjour,\n\nUn nouveau collaborateur souhaite rejoindre votre équipe {{partner_name}} sur DMC Alliance.\n\n📋 **Informations du demandeur :**\n- Nom : {{contact_name}}\n- Email : {{contact_email}}\n- Téléphone : {{contact_phone}}\n- Message : {{message}}\n\n👉 **Action requise :**\nConnectez-vous à votre espace partenaire pour accepter ou refuser cette demande.\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello,\n\nA new collaborator wants to join your team {{partner_name}} on DMC Alliance.\n\n📋 **Applicant Information:**\n- Name: {{contact_name}}\n- Email: {{contact_email}}\n- Phone: {{contact_phone}}\n- Message: {{message}}\n\n👉 **Action required:**\nLog in to your partner area to accept or reject this request.\n\nBest regards,\nThe DMC Alliance Team',
  '["partner_name", "contact_name", "contact_email", "contact_phone", "message"]'
),
(
  'agency_join_approved',
  'Demande acceptée - Bienvenue',
  '✅ Vous avez rejoint {{partner_name}} sur DMC Alliance',
  '✅ You have joined {{partner_name}} on DMC Alliance',
  E'Bonjour {{contact_name}},\n\n🎉 Votre demande pour rejoindre {{partner_name}} a été acceptée !\n\nVous pouvez maintenant vous connecter à l''espace partenaire et collaborer avec votre équipe.\n\n👉 Connectez-vous ici : {{login_url}}\n\nBienvenue dans l''équipe !\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{contact_name}},\n\n🎉 Your request to join {{partner_name}} has been accepted!\n\nYou can now log in to the partner area and collaborate with your team.\n\n👉 Log in here: {{login_url}}\n\nWelcome to the team!\n\nBest regards,\nThe DMC Alliance Team',
  '["partner_name", "contact_name", "login_url"]'
),
(
  'agency_join_rejected',
  'Demande non acceptée',
  'DMC Alliance - Réponse à votre demande',
  'DMC Alliance - Response to your request',
  E'Bonjour {{contact_name}},\n\nVotre demande pour rejoindre {{partner_name}} sur DMC Alliance n''a pas été acceptée.\n\nSi vous pensez qu''il s''agit d''une erreur, veuillez contacter directement l''équipe de {{partner_name}}.\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{contact_name}},\n\nYour request to join {{partner_name}} on DMC Alliance has not been accepted.\n\nIf you believe this is an error, please contact the {{partner_name}} team directly.\n\nBest regards,\nThe DMC Alliance Team',
  '["partner_name", "contact_name"]'
),
(
  'agency_info_request',
  'Demande d''information agence',
  '📧 Nouvelle demande d''information de {{agency_name}}',
  '📧 New information request from {{agency_name}}',
  E'Bonjour,\n\nUne agence a fait une demande d''information via DMC Alliance.\n\n📋 **Détails de la demande :**\n- Agence : {{agency_name}}\n- Contact : {{contact_name}}\n- Email : {{contact_email}}\n- Téléphone : {{contact_phone}}\n\n📍 **Circuit concerné :**\n{{circuit_title}}\n\n💬 **Message :**\n{{message}}\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello,\n\nAn agency has made an information request via DMC Alliance.\n\n📋 **Request details:**\n- Agency: {{agency_name}}\n- Contact: {{contact_name}}\n- Email: {{contact_email}}\n- Phone: {{contact_phone}}\n\n📍 **Circuit:**\n{{circuit_title}}\n\n💬 **Message:**\n{{message}}\n\nBest regards,\nThe DMC Alliance Team',
  '["agency_name", "contact_name", "contact_email", "contact_phone", "circuit_title", "message"]'
),
(
  'agency_booking_request',
  'Demande de réservation agence',
  '📅 Nouvelle demande de réservation de {{agency_name}}',
  '📅 New booking request from {{agency_name}}',
  E'Bonjour,\n\nUne agence a fait une demande de réservation via DMC Alliance.\n\n📋 **Détails de la réservation :**\n- Agence : {{agency_name}}\n- Contact : {{contact_name}}\n- Email : {{contact_email}}\n- Téléphone : {{contact_phone}}\n\n📍 **Circuit :**\n{{circuit_title}}\n\n👥 **Nombre de places demandées :** {{places_requested}}\n\n💬 **Notes :**\n{{notes}}\n\n👉 Connectez-vous à votre espace partenaire pour traiter cette demande.\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello,\n\nAn agency has made a booking request via DMC Alliance.\n\n📋 **Booking details:**\n- Agency: {{agency_name}}\n- Contact: {{contact_name}}\n- Email: {{contact_email}}\n- Phone: {{contact_phone}}\n\n📍 **Circuit:**\n{{circuit_title}}\n\n👥 **Places requested:** {{places_requested}}\n\n💬 **Notes:**\n{{notes}}\n\n👉 Log in to your partner area to process this request.\n\nBest regards,\nThe DMC Alliance Team',
  '["agency_name", "contact_name", "contact_email", "contact_phone", "circuit_title", "places_requested", "notes"]'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subject_fr = EXCLUDED.subject_fr,
  subject_en = EXCLUDED.subject_en,
  body_fr = EXCLUDED.body_fr,
  body_en = EXCLUDED.body_en,
  variables = EXCLUDED.variables,
  updated_at = NOW();
