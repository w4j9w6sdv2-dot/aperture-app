"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type Locale = "it" | "en"

// Dictionary of all UI strings. Add new keys here for both languages.
const messages: Record<Locale, Record<string, string>> = {
  en: {
    // Header
    "header.searchPlaceholder": "Search photos, tags, or photographers…",
    "header.upload": "Upload",
    "header.login": "Log in",
    "header.signup": "Sign up",
    "header.logout": "Log out",
    "header.profile": "Profile",
    "header.home": "Home",
    "header.language": "Language",

    // Footer
    "footer.tagline": "Where photographers come alive",
    "footer.home": "Home",
    "footer.popularTags": "Popular tags",
    "footer.about": "About",
    "footer.copyright": "© 2026 Aperture · Where photographers come alive.",

    // Auth modal
    "auth.loginTitle": "Welcome back",
    "auth.signupTitle": "Join Aperture",
    "auth.loginSubtitle": "Sign in to your account to continue",
    "auth.signupSubtitle": "Create an account to start sharing your photos",
    "auth.username": "Username",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.usernamePlaceholder": "your_username",
    "auth.emailPlaceholder": "you@example.com",
    "auth.passwordPlaceholder": "••••••••",
    "auth.loginSubmit": "Sign in",
    "auth.signupSubmit": "Create account",
    "auth.toggleToSignup": "Don't have an account? Sign up",
    "auth.toggleToLogin": "Already have an account? Sign in",
    "auth.demoHint": "Demo login",
    "auth.invalidCredentials": "Invalid username or password",
    "auth.usernameTaken": "Username already taken",
    "auth.emailTaken": "Email already registered",
    "auth.required": "All fields are required",
    "auth.subtitle": "Join a community where photographers come alive.",
    "auth.demoHintText": "Try the demo account:",
    "auth.demoPassword": "password",
    "auth.passwordMinLength": "At least 6 characters",

    // Feed view
    "feed.discover": "Discover",
    "feed.feed": "Feed",
    "feed.newest": "Newest",
    "feed.popular": "Popular",
    "feed.emptyDiscover": "No photos yet",
    "feed.emptyDiscoverDesc": "Be the first to share a photo on Aperture",
    "feed.emptyFeed": "Your feed is empty",
    "feed.emptyFeedDesc": "Follow photographers to see their latest work here",
    "feed.loadMore": "Load more",
    "feed.loading": "Loading photos…",
    "feed.views": "views",
    "feed.feedWaiting": "Your feed is waiting",
    "feed.feedWaitingDesc": "Follow photographers to see their latest work here. Sign in to get started.",
    "feed.feedSignin": "Sign in to see your feed",
    "feed.emptyFeedTitle": "Nothing in your feed yet",
    "feed.emptyFeedDescAlt": "Head to Discover and follow some photographers to fill your feed.",
    "feed.exploreDiscover": "Explore Discover",
    "feed.uploadAction": "Upload a photo",
    "feed.endReached": "You've reached the end.",

    // Photo detail
    "photo.back": "Back",
    "photo.like": "Like",
    "photo.liked": "Liked",
    "photo.comments": "Comments",
    "photo.addComment": "Add a comment…",
    "photo.postComment": "Post",
    "photo.deleteComment": "Delete",
    "photo.editComment": "Edit",
    "photo.noComments": "No comments yet. Start the conversation!",
    "photo.by": "by",
    "photo.uploadedBy": "Uploaded by",
    "photo.tags": "Tags",
    "photo.notFound": "Photo not found",
    "photo.notFoundDesc": "This photo may have been deleted or is no longer available.",
    "photo.backToHome": "Back to home",
    "photo.deleteConfirm": "Delete this photo? This cannot be undone.",
    "photo.publishedAt": "Published {time}",
    "photo.signInToComment": "Sign in to comment",
    "photo.postCommentAria": "Post comment",
    "photo.deletePhotoAria": "Delete photo",
    "photo.likeAria": "Like photo",
    "photo.unlikeAria": "Unlike photo",

    // Upload modal
    "upload.title": "Upload a photo",
    "upload.dropHere": "Drop your photo here",
    "upload.orClick": "or click to browse",
    "upload.selectFile": "Select file",
    "upload.photoTitle": "Title",
    "upload.photoTitlePlaceholder": "Mountain Lake Mirror",
    "upload.description": "Description",
    "upload.descriptionPlaceholder": "Tell the story behind this photo…",
    "upload.tags": "Tags",
    "upload.tagsPlaceholder": "Add tags (press Enter after each)",
    "upload.tagsHint": "Help others discover your photo",
    "upload.submit": "Publish photo",
    "upload.cancel": "Cancel",
    "upload.uploading": "Publishing…",
    "upload.success": "Photo published!",
    "upload.error": "Failed to upload photo",
    "upload.noFile": "Please select a photo first",
    "upload.titleRequired": "Please add a title",
    "upload.subtitle": "Share your work with the community. JPEG, PNG, or WebP up to 25 MB.",
    "upload.processing": "Processing image…",
    "upload.dragDrop": "Drag & drop an image here",
    "upload.imageFile": "Please select an image file",
    "upload.imageSize": "Image must be under 25 MB",
    "upload.readFailed": "Failed to read image",
    "upload.maxTags": "Maximum 10 tags",
    "upload.tagCount": "{count} photos",

    // Profile
    "profile.photos": "photos",
    "profile.followers": "followers",
    "profile.following": "following",
    "profile.follow": "Follow",
    "profile.following": "Following",
    "profile.unfollow": "Unfollow",
    "profile.editProfile": "Edit profile",
    "profile.joined": "Joined",
    "profile.noPhotos": "No photos yet",
    "profile.noPhotosDesc": "This user hasn't shared any photos yet",
    "profile.yourPhotos": "Your photos",
    "profile.photosTitle": "Photos",
    "profile.noPhotosYou": "You haven't uploaded any photos",
    "profile.shareFirst": "Share your first photo with the community.",
    "profile.userNoPhotos": "{user} hasn't uploaded any photos yet.",
    "profile.signupToUpload": "Sign up to upload",

    // Search
    "search.title": "Search results for",
    "search.empty": "No results found",
    "search.emptyDesc": "Try a different search term",
    "search.placeholder": "Search photos, tags, photographers…",
    "search.results": "Search results",
    "search.resultsDesc": "matching photos, tags, and photographers",
    "search.noMatchesDesc": "We couldn't find anything for \"{query}\". Try a different keyword, like a tag name or photographer handle.",
    "search.backToDiscover": "Back to discover",

    // Tag view
    "tag.photosTagged": "Photos tagged with",
    "tag.empty": "No photos with this tag yet",
    "tag.tagLabel": "Tag",
    "tag.related": "Related:",
    "tag.emptyDesc": "There aren't any photos tagged \"{tag}\" yet.",
    "tag.backToDiscover": "Back to discover",

    // Toasts
    "toast.welcome": "Welcome to Aperture",
    "toast.loggedOut": "You've been logged out",
    "toast.likeAdded": "Added to your likes",
    "toast.likeRemoved": "Removed from your likes",
    "toast.commentAdded": "Comment posted",
    "toast.commentDeleted": "Comment deleted",
    "toast.followed": "You are now following {user}",
    "toast.unfollowed": "Unfollowed {user}",
    "toast.photoDeleted": "Photo deleted",
    "toast.signInToLike": "Sign in to like photos",
    "toast.signInToFollow": "Sign in to follow users",
    "toast.welcomeBack": "Welcome back!",
    "toast.signupFailed": "Account created, but sign-in failed: {error}",

    // Empty state
    "empty.noResults": "Nothing here yet",
    "empty.beFirst": "Be the first to share something",

    // User menu
    "menu.viewProfile": "View profile",
    "menu.logOut": "Log out",
    "menu.reseed": "Re-seed demo data",
    "menu.reseedSuccess": "Database re-seeded",
    "menu.reseedError": "Failed to seed",

    // Common
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.save": "Save",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.confirmDelete": "Are you sure you want to delete this?",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "common.retry": "Try again",
  },
  it: {
    // Header
    "header.searchPlaceholder": "Cerca foto, tag o fotografi…",
    "header.upload": "Carica",
    "header.login": "Accedi",
    "header.signup": "Registrati",
    "header.logout": "Esci",
    "header.profile": "Profilo",
    "header.home": "Home",
    "header.language": "Lingua",

    // Footer
    "footer.tagline": "Dove i fotografi prendono vita",
    "footer.home": "Home",
    "footer.popularTags": "Tag popolari",
    "footer.about": "Info",
    "footer.copyright": "© 2026 Aperture · Dove i fotografi prendono vita.",

    // Auth modal
    "auth.loginTitle": "Bentornato",
    "auth.signupTitle": "Unisciti ad Aperture",
    "auth.loginSubtitle": "Accedi al tuo account per continuare",
    "auth.signupSubtitle": "Crea un account per iniziare a condividere le tue foto",
    "auth.username": "Nome utente",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.usernamePlaceholder": "tuo_username",
    "auth.emailPlaceholder": "tu@esempio.com",
    "auth.passwordPlaceholder": "••••••••",
    "auth.loginSubmit": "Accedi",
    "auth.signupSubmit": "Crea account",
    "auth.toggleToSignup": "Non hai un account? Registrati",
    "auth.toggleToLogin": "Hai già un account? Accedi",
    "auth.demoHint": "Login demo",
    "auth.invalidCredentials": "Nome utente o password non validi",
    "auth.usernameTaken": "Nome utente già preso",
    "auth.emailTaken": "Email già registrata",
    "auth.required": "Tutti i campi sono obbligatori",
    "auth.subtitle": "Unisciti a una community dove i fotografi prendono vita.",
    "auth.demoHintText": "Prova l'account demo:",
    "auth.demoPassword": "password",
    "auth.passwordMinLength": "Almeno 6 caratteri",

    // Feed view
    "feed.discover": "Scopri",
    "feed.feed": "Feed",
    "feed.newest": "Recenti",
    "feed.popular": "Popolari",
    "feed.emptyDiscover": "Nessuna foto ancora",
    "feed.emptyDiscoverDesc": "Sii il primo a condividere una foto su Aperture",
    "feed.emptyFeed": "Il tuo feed è vuoto",
    "feed.emptyFeedDesc": "Segui fotografi per vedere qui il loro lavoro più recente",
    "feed.loadMore": "Carica altro",
    "feed.loading": "Caricamento foto…",
    "feed.views": "visualizzazioni",
    "feed.feedWaiting": "Il tuo feed ti aspetta",
    "feed.feedWaitingDesc": "Segui fotografi per vedere qui il loro lavoro più recente. Accedi per iniziare.",
    "feed.feedSignin": "Accedi per vedere il tuo feed",
    "feed.emptyFeedTitle": "Niente nel tuo feed ancora",
    "feed.emptyFeedDescAlt": "Vai su Scopri e segui alcuni fotografi per riempire il tuo feed.",
    "feed.exploreDiscover": "Esplora Scopri",
    "feed.uploadAction": "Carica una foto",
    "feed.endReached": "Hai raggiunto la fine.",

    // Photo detail
    "photo.back": "Indietro",
    "photo.like": "Mi piace",
    "photo.liked": "Ti piace",
    "photo.comments": "Commenti",
    "photo.addComment": "Aggiungi un commento…",
    "photo.postComment": "Pubblica",
    "photo.deleteComment": "Elimina",
    "photo.editComment": "Modifica",
    "photo.noComments": "Nessun commento ancora. Inizia la conversazione!",
    "photo.by": "di",
    "photo.uploadedBy": "Caricata da",
    "photo.tags": "Tag",
    "photo.notFound": "Foto non trovata",
    "photo.notFoundDesc": "Questa foto potrebbe essere stata eliminata o non più disponibile.",
    "photo.backToHome": "Torna alla home",
    "photo.deleteConfirm": "Eliminare questa foto? L'operazione non può essere annullata.",
    "photo.publishedAt": "Pubblicata {time}",
    "photo.signInToComment": "Accedi per commentare",
    "photo.postCommentAria": "Pubblica commento",
    "photo.deletePhotoAria": "Elimina foto",
    "photo.likeAria": "Metti mi piace alla foto",
    "photo.unlikeAria": "Rimuovi mi piace alla foto",

    // Upload modal
    "upload.title": "Carica una foto",
    "upload.dropHere": "Trascina qui la tua foto",
    "upload.orClick": "o clicca per sfogliare",
    "upload.selectFile": "Seleziona file",
    "upload.photoTitle": "Titolo",
    "upload.photoTitlePlaceholder": "Specchio del Lago di Montagna",
    "upload.description": "Descrizione",
    "upload.descriptionPlaceholder": "Racconta la storia dietro questa foto…",
    "upload.tags": "Tag",
    "upload.tagsPlaceholder": "Aggiungi tag (premi Invio dopo ciascuno)",
    "upload.tagsHint": "Aiuta altri a scoprire la tua foto",
    "upload.submit": "Pubblica foto",
    "upload.cancel": "Annulla",
    "upload.uploading": "Pubblicazione…",
    "upload.success": "Foto pubblicata!",
    "upload.error": "Impossibile caricare la foto",
    "upload.noFile": "Seleziona prima una foto",
    "upload.titleRequired": "Aggiungi un titolo",
    "upload.subtitle": "Condividi il tuo lavoro con la community. JPEG, PNG o WebP fino a 25 MB.",
    "upload.processing": "Elaborazione immagine…",
    "upload.dragDrop": "Trascina e rilascia un'immagine qui",
    "upload.imageFile": "Seleziona un file immagine",
    "upload.imageSize": "L'immagine deve essere inferiore a 25 MB",
    "upload.readFailed": "Impossibile leggere l'immagine",
    "upload.maxTags": "Massimo 10 tag",
    "upload.tagCount": "{count} foto",

    // Profile
    "profile.photos": "foto",
    "profile.followers": "follower",
    "profile.following": "following",
    "profile.follow": "Segui",
    "profile.following": "Stai seguendo",
    "profile.unfollow": "Non seguire più",
    "profile.editProfile": "Modifica profilo",
    "profile.joined": "Iscritto",
    "profile.noPhotos": "Nessuna foto ancora",
    "profile.noPhotosDesc": "Questo utente non ha ancora condiviso foto",
    "profile.yourPhotos": "Le tue foto",
    "profile.photosTitle": "Foto",
    "profile.noPhotosYou": "Non hai ancora caricato foto",
    "profile.shareFirst": "Condividi la tua prima foto con la community.",
    "profile.userNoPhotos": "{user} non ha ancora caricato foto.",
    "profile.signupToUpload": "Registrati per caricare",

    // Search
    "search.title": "Risultati di ricerca per",
    "search.empty": "Nessun risultato trovato",
    "search.emptyDesc": "Prova un termine di ricerca diverso",
    "search.placeholder": "Cerca foto, tag, fotografi…",
    "search.results": "Risultati di ricerca",
    "search.resultsDesc": "foto, tag e fotografi corrispondenti",
    "search.noMatchesDesc": "Non abbiamo trovato nulla per \"{query}\". Prova una parola chiave diversa, come un nome di tag o un nome utente.",
    "search.backToDiscover": "Torna a Scopri",

    // Tag view
    "tag.photosTagged": "Foto taggate con",
    "tag.empty": "Nessuna foto con questo tag ancora",
    "tag.tagLabel": "Tag",
    "tag.related": "Correlati:",
    "tag.emptyDesc": "Non ci sono ancora foto taggate con \"{tag}\".",
    "tag.backToDiscover": "Torna a Scopri",

    // Toasts
    "toast.welcome": "Benvenuto su Aperture",
    "toast.loggedOut": "Sei uscito dall'account",
    "toast.likeAdded": "Aggiunto ai tuoi mi piace",
    "toast.likeRemoved": "Rimosso dai tuoi mi piace",
    "toast.commentAdded": "Commento pubblicato",
    "toast.commentDeleted": "Commento eliminato",
    "toast.followed": "Ora segui {user}",
    "toast.unfollowed": "Non segui più {user}",
    "toast.photoDeleted": "Foto eliminata",
    "toast.signInToLike": "Accedi per mettere mi piace alle foto",
    "toast.signInToFollow": "Accedi per seguire gli utenti",
    "toast.welcomeBack": "Bentornato!",
    "toast.signupFailed": "Account creato, ma accesso fallito: {error}",

    // Empty state
    "empty.noResults": "Non c'è nulla qui",
    "empty.beFirst": "Sii il primo a condividere qualcosa",

    // User menu
    "menu.viewProfile": "Vedi profilo",
    "menu.logOut": "Esci",
    "menu.reseed": "Ripristina dati demo",
    "menu.reseedSuccess": "Database ripristinato",
    "menu.reseedError": "Ripristino fallito",

    // Common
    "common.cancel": "Annulla",
    "common.delete": "Elimina",
    "common.edit": "Modifica",
    "common.save": "Salva",
    "common.close": "Chiudi",
    "common.confirm": "Conferma",
    "common.confirmDelete": "Sei sicuro di voler eliminare?",
    "common.loading": "Caricamento…",
    "common.error": "Qualcosa è andato storto",
    "common.retry": "Riprova",
  },
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it")

  // Load saved locale from localStorage on mount.
  // setState-in-effect is intentional here: we need the server-rendered HTML
  // to use the default "it" locale (so it matches what the client renders
  // before localStorage is read), then update after mount to avoid
  // hydration mismatches. useSyncExternalStore would be overkill since we
  // don't subscribe to external changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aperture-locale") as Locale | null
      if (saved === "it" || saved === "en") {
        setLocaleState(saved)
      } else {
        // Detect browser language
        const browserLang = navigator.language.toLowerCase()
        if (browserLang.startsWith("en")) {
          setLocaleState("en")
        } else {
          setLocaleState("it") // default to Italian
        }
      }
    } catch {}
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem("aperture-locale", newLocale)
    } catch {}
  }

  const t = (key: string, params?: Record<string, string>): string => {
    let value = messages[locale]?.[key] ?? messages.en[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, v)
      }
    }
    return value
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return ctx
}

// Convenience hook for just the translation function
export function useT() {
  return useI18n().t
}
