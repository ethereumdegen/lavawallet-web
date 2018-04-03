export default class AlertRenderer {



     renderError(message)
    {
      console.log('render error',message)
      this.alertMessage = message;
    }

     renderHelp(message)
    {
      console.log('render help',message)
       this.alertMessage = message;
    }


    getAlertMessage()
    {
      return this.alertMessage;
    }

}
