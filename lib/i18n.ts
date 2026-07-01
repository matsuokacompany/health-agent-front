export const locales = ['en', 'es'] as const;
export type Locale = typeof locales[number];

export const languageOptions: Array<{ locale: Locale; label: string }> = [
  { locale: 'en', label: 'English' },
  { locale: 'es', label: 'Español' },
];

export const defaultLocale: Locale = 'en';

export const messages = {
  en: {
    app: { name: 'Julha Health', patientPortal: 'Patient portal', protectedData: 'Your data stays protected while you browse.', hide: 'Hide', footer: 'Julha Health • Protected data • Clinical support via WhatsApp' },
    nav: { dashboard: 'Dashboard', monitoring: 'Monitoring', anamnesis: 'Anamnesis', profile: 'Profile', changePassword: 'Change password', logout: 'Sign out', openMenu: 'Open navigation menu', closeMenu: 'Close navigation menu', mainMenu: 'Main menu', currentMode: 'Current mode', switchEnvironment: 'Switch environment' },
    header: { searchLabel: 'Search the platform', searchPlaceholder: '🔎 Search patients, reports, plans...', mobileSearchPlaceholder: 'Search...', openSearch: 'Open search', closeSearch: 'Close search', openUserMenu: 'Open user menu', userFallback: 'User' },
    theme: { toggle: 'Toggle theme', light: 'Activate light theme', dark: 'Activate dark theme' },
    language: { change: 'Change language', english: 'English', spanish: 'Español' },
    monitoring: { eyebrow: 'Monitoring', title: 'Care period', description: 'View plan status and follow every WhatsApp check-in in the monthly calendar.', activePlan: '📡 Active plan', defaultPlanName: 'Care plan', status: 'Status', startsAt: 'Start date', endsAt: 'End date', answered: 'Answered', notStarted: 'Monitoring has not started yet', monthlyCalendar: 'Monthly calendar', previousMonth: 'Previous month', nextMonth: 'Next month', dayActions: 'Day actions', date: 'Date', symptoms: 'Symptoms', yes: 'Yes', no: 'No', descriptionLabel: 'Description', cause: 'Cause', noDescription: 'No description sent.', editAnswer: '✏️ Edit answer', deleteAnswer: '🗑️ Delete answer', noReportForDay: 'This day is marked as “{status}” and has no answer to view, edit, or delete.', selectDay: 'Select a calendar day to view answers and available actions.', editTitle: 'Edit monitoring answer', cancel: 'Cancel', saving: 'Saving...', saveAnswer: 'Save answer', deleteTitle: 'Delete answer', deleteConfirm: 'Confirm to delete the selected answer from the monthly calendar.', deleting: 'Deleting...', answerUpdated: 'Answer updated.', answerDeleted: 'Answer deleted from monitoring.', weekdays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], statuses: { answered: 'Answered', unanswered: 'Not answered', noCheckIn: 'No check-in', incomplete: 'Incomplete' } },
  },
  es: {
    app: { name: 'Julha Salud', patientPortal: 'Portal del paciente', protectedData: 'Tus datos permanecen protegidos durante la navegación.', hide: 'Ocultar', footer: 'Julha Salud • Datos protegidos • Soporte clínico por WhatsApp' },
    nav: { dashboard: 'Panel', monitoring: 'Monitoreo', anamnesis: 'Anamnesis', profile: 'Perfil', changePassword: 'Cambiar contraseña', logout: 'Salir', openMenu: 'Abrir menú de navegación', closeMenu: 'Cerrar menú de navegación', mainMenu: 'Menú principal', currentMode: 'Modo actual', switchEnvironment: 'Cambiar entorno' },
    header: { searchLabel: 'Buscar en la plataforma', searchPlaceholder: '🔎 Buscar pacientes, informes, planes...', mobileSearchPlaceholder: 'Buscar...', openSearch: 'Abrir búsqueda', closeSearch: 'Cerrar búsqueda', openUserMenu: 'Abrir menú de usuario', userFallback: 'Usuario' },
    theme: { toggle: 'Alternar tema', light: 'Activar tema claro', dark: 'Activar tema oscuro' },
    language: { change: 'Cambiar idioma', english: 'English', spanish: 'Español' },
    monitoring: { eyebrow: 'Monitoreo', title: 'Período de acompañamiento', description: 'Consulta el estado del plan y sigue cada check-in de WhatsApp en el calendario mensual.', activePlan: '📡 Plan activo', defaultPlanName: 'Plan de acompañamiento', status: 'Estado', startsAt: 'Fecha de inicio', endsAt: 'Fecha de término', answered: 'Respondidos', notStarted: 'El monitoreo aún no ha comenzado', monthlyCalendar: 'Calendario mensual', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente', dayActions: 'Acciones del día', date: 'Fecha', symptoms: 'Síntomas', yes: 'Sí', no: 'No', descriptionLabel: 'Descripción', cause: 'Causa', noDescription: 'Sin descripción enviada.', editAnswer: '✏️ Editar respuesta', deleteAnswer: '🗑️ Eliminar respuesta', noReportForDay: 'Este día está marcado como “{status}” y no tiene respuesta para ver, editar o eliminar.', selectDay: 'Selecciona un día del calendario para ver respuestas y acciones disponibles.', editTitle: 'Editar respuesta del monitoreo', cancel: 'Cancelar', saving: 'Guardando...', saveAnswer: 'Guardar respuesta', deleteTitle: 'Eliminar respuesta', deleteConfirm: 'Confirma para eliminar la respuesta seleccionada del calendario mensual.', deleting: 'Eliminando...', answerUpdated: 'Respuesta actualizada.', answerDeleted: 'Respuesta eliminada del monitoreo.', weekdays: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'], statuses: { answered: 'Respondido', unanswered: 'No respondido', noCheckIn: 'Día sin check-in', incomplete: 'Incompleto' } },
  },
} as const;

export type TranslationKey = string;
