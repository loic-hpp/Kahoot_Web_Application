export const HTTP_RESPONSES: { [key: string]: number } = {
    ok: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    internalServerError: 500,
};

export const POINTS = {
    min: 10,
    max: 100,
    increment: 10,
};

export const MAX_PLAYER_NAME_LENGTH = 10;

export const MAX_ACCESS_CODE_LENGTH = 4;

export const QRL_TIME = 60;

export const QCM_TIME = {
    min: 10,
    max: 60,
};

export const CHOICES = {
    min: 2,
    max: 4,
};

export const MAX_PANIC_TIME_FOR = {
    qcm: 10,
    qrl: 20,
};

export const ERROR_MESSAGE_FOR = {
    name: '\n- Un nom est requis',
    nameType: '\n- Un nom en format texte est requis',
    existingName: '\n- Le nom choisi existe déjà',
    description: '\n- Une description est requise',
    descriptionType: '\n- Une description en format texte est requise',
    qcmTime: '\n- Le temps des QCM doit être compris entre 10 et 60 secondes',
    qcmTimeType: '\n- Un nombre pour le temps de QCM est requis',
    questions: '\n- Le jeu doit comporter au moins une question valide',
    questionsType: '\n- Un tableau de questions est requis',
};

export const DIALOG = {
    questionFormWidth: '80%',
    newNameWidth: '40%',
    transitionWidth: '45rem',
    transitionHeight: '18rem',
    endMatchTransitionWidth: '55rem',
    endMatchTransitionHeight: '24rem',
    confirmationWidth: '40rem',
    confirmationHeight: '15rem',
};

export const DIALOG_MESSAGE = {
    cancelQuestion: 'annuler la création de la question',
    gameDeletion: 'supprimer ce jeu',
    cancelQuestionModification: 'annuler les modification à cette question',
    cancelChoiceDeletion: 'supprimer ce choix de réponse',
    cancelGameCreation: 'annuler la création de ce jeu',
    cancelModifyGame: 'annuler la modification de ce jeu',
    cancelMatch: 'annuler cette partie',
    finishMatch: 'terminer cette partie',
    quitMatch: 'quitter cette partie',
    clearHistory: "effacer l'historique des parties",
};

export const SNACKBAR_DURATION = 4000;
export const SNACKBAR_MESSAGE = {
    gameImported: 'Jeu importé avec succès',
    gameCreated: 'Jeu créé avec succès',
    gameUpdated: 'Jeu modifié avec succès',
    minQuestionNumber: 'La partie doit avoir au moins 2 questions',
};

export const LENGTHS = {
    questionId: 9,
    gameId: 8,
    accessCode: 4,
};

export const FACTORS = {
    ascendingSort: 1,
    descendingSort: -1,
    firstChoice: 1.2,
    timeProgressSpinner: 20,
    percentage: 100,
};

export const DURATIONS = {
    bonusMessage: 2500,
    backToMatch: 1000,
    timerInterval: 1000,
    panicModeInterval: 250,
    notifyChatAccessibility: 3500,
    qrlHistogramUpdateInterval: 5,
};

export const ERRORS = {
    noIndexFound: -1,
};

export const CHAR_SETS = {
    accessCode: '0123456789',
    id: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
};

export const NAMES = {
    manager: 'Organisateur',
    tester: 'Testeur',
    system: 'Système',
};

export const PLAYERS_NAME_COLORS = {
    red: 'red',
    yellow: '#FFD700',
    green: 'green',
    black: 'black',
};

export const TRANSITIONS_DURATIONS = {
    startOfTheGame: 5,
    betweenQuestions: 3,
    endMatchAfterPlayersLeft: 5,
};

export const FEEDBACK_MESSAGES = {
    sameScore: 'Votre score reste inchangé',
    wrongAnswer: "vous n'avez malheureusement pas eu la bonne réponse",
    rightAnswer: 'vous avez eu la bonne réponse !',
    halfPoints: 'vous avez eu la moitié des points',
    bonus: 'Vous êtes le/la premier/ère à avoir la bonne réponse ! +20% bonus',
    chatBlocked: 'Vous ne pouvez plus envoyer des messages pour le moment',
    chatUnblocked: 'Vous pouvez à nouveau envoyer des messages',
    playerLeftMatch: 'a quitté la partie',
    pointsAddedToScore: "points s'ajoutent à votre score !",
    waiting: 'veuillez patienter',
    duringEvaluation: 'Évaluation de la question en cours',
};

export const TRANSITIONS_MESSAGES = {
    beginMatch: 'La partie commence dans',
    transitionToResultsView: 'Présentation des résultats dans',
    transitionToNextQuestion: 'Prochaine question dans',
    nextQuestionTestView: 'Prochaine question',
    matchEndTestView: 'Fin de la partie',
    endMatchAfterPlayersLeft: "Tous les joueurs ont quitté la partie, vous serez dirigé vers la page d'accueil dans",
};

export const HISTOGRAM_TEXTS = {
    playersInteract: 'Ont interagi',
    playersInteraction: 'Interactions des joueurs',
    playersDidNotInteract: "N'ont pas interagi",
    percentages: 'Pourcentages attribués',
    answersChoices: 'Choix de réponse',
    playersNumber: 'Nombre de joueurs',
    players: 'Joueurs',
};

export const QUESTION_TYPE = {
    qcm: 'QCM',
    qrl: 'QRL',
};

export const CHART_COLOR = {
    qcm: '#F9CBA8',
    qrl: '#4682B4',
};

export enum SocketsSendEvents {
    JoinMatch = 'joinMatchRoom',
    SendMessage = 'sendMessage',
    SwitchQuestion = 'switchQuestion',
    UpdateAnswer = 'updateAnswer',
    StartTimer = 'startTimer',
    StopTimer = 'stopTimer',
    CancelGame = 'cancelGame',
    FinishMatch = 'finishMatch',
    BeginMatch = 'beginMatch',
    RemovePlayer = 'removePlayer',
    UpdateScore = 'updatePlayerScore',
    SetFinalAnswer = 'setFinalAnswer',
    PlayerLeftAfterMatchBegun = 'playerLeftAfterMatchBegun',
    SendChartData = 'sendChartData',
    BeginQrlEvaluation = 'beginQrlEvaluation',
    FinishQrlEvaluation = 'finishQrlEvaluation',
    PanicModeActivated = 'panicModeActivated',
    ChangeChatAccessibility = 'changeChatAccessibility',
    HistogramTime = 'histogramTime',
}

export enum SocketsOnEvents {
    NewPlayer = 'newPlayer',
    ChatMessage = 'chatMessage',
    NextQuestion = 'nextQuestion',
    AnswerUpdated = 'answerUpdated',
    NewTime = 'newTime',
    GameCanceled = 'gameCanceled',
    MatchFinished = 'matchFinished',
    JoinBegunMatch = 'joinMatch',
    PlayerRemoved = 'playerRemoved',
    UpdatedScore = 'updatedPlayerScore',
    FinalAnswerSet = 'finalAnswerSet',
    PlayerDisabled = 'playerDisabled',
    AllPlayersResponded = 'allPlayersResponded',
    UpdateChartDataList = 'updateChartDataList',
    QrlEvaluationBegun = 'qrlEvaluationBegun',
    QrlEvaluationFinished = 'qrlEvaluationFinished',
    PanicModeActivated = 'panicModeActivated',
    ChatAccessibilityChanged = 'chatAccessibilityChanged',
    HistogramTime = 'histogramTime',
}
