const express =require("express");
const mongoose =require("mongoose");
const bodyparser=require("body-parser");

const app=express();
app.set('view engine','ejs');

app.use(bodyparser.urlencoded({extended:true}));
mongoose.connect('mongodb+srv://louam-lemjid:8hAgfKf2ZDauLxoj@cluster0.mjqmopn.mongodb.net/compteepargne');
const compteEpargneschema=new mongoose.Schema({
    dateValeur:Date,
    dateOperation:Date,
    operationDebit:Number,
    operationCredit:Number,
    nombreJour:Number,
    taux:Number,
    interet:Number,
    ouvertureCompte:Date,
    solde:Number
});
const Operation=mongoose.model('Operation',compteEpargneschema);

const nombrebJoursBanqueschema=new mongoose.Schema({
    date:Date,
    taux:Number,
    jrbanque:Number,
    impot:Number
});
const Banque=mongoose.model('Banque',nombrebJoursBanqueschema);
const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aout", "Sep", "Oct", "Nov", "Dec"];
app.use(express.static("public"));
const db = mongoose.connection;
var test=false;
//logique des fonctions
//renvoie le solde a chaque sesie
function Solde(array,date){
    var s=0;
    
    if (array.length>1){
        
        var j=0;
        console.log(array.length,date,array[j].dateValeur)
        console.log(date>=array[j].dateValeur && j<array.length-1)
        while (date>=array[j].dateValeur && j<array.length-1){
            console.log(s,array[j].operationDebit,array[j].operationCredit)
            s+=array[j].operationDebit+array[j].operationCredit;
            console.log(s)
            j++;
            
        }
        console.log("j est : ",j)
        if (j!=0){s+=array[j].operationDebit+array[j].operationCredit;};
        
    }else{
        if(array.length==0){return s}
        if(array.length==1){s+=array[0].operationDebit+array[0].operationCredit;}
    }

    
    return s
}
//renvoie la date valeur debiteur
function Debit(joursBanque){
    let date=new Date();
    let day=date.getDate();
    let month=date.getMonth()+1;
    let year=date.getFullYear();
    let dateF=month+"/"+day+"/"+year;
    date=new Date(dateF);
    date.setDate(date.getDate()-joursBanque);
    let day2=date.getDate();
    let month2=date.getMonth()+1;
    let year2=date.getFullYear();
    let dateE=new Date(month2+"-"+day2+"-"+year2);
    return dateE;
}
//renvoie la date valeur crediteur
function Credit(joursBanque){
    let date=new Date();
    let day=date.getDate();
    let month=date.getMonth()+1;
    let year=date.getFullYear();
    let dateF=month+"/"+day+"/"+year;
    date=new Date(dateF);
    date.setDate(date.getDate()+joursBanque);
    let day2=date.getDate();
    let month2=date.getMonth()+1;
    let year2=date.getFullYear();
    let dateE=new Date(month2+"-"+day2+"-"+year2);
    return dateE;
}
//calcul de nombre de jour
function NombreJour(array,date){
    var date1=date.getTime();
    if (array.length>1){
        var j=0;
        while (date>=array[j].dateValeur && j<array.length-1){
            
            
            j++;
            
        }
        if(j!=0){
            let date2=array[j].dateValeur.getTime();
            return (date1-date2)/(1000*60*60*24);
        }
    }else{
        if(array.length==1){
            if(date>=array[0].dateValeur){
                let date2=array[0].dateValeur.getTime();
                console.log(("nombre de jours : ",date1-date2)/(1000*60*60*24))
                return (date1-date2)/(1000*60*60*24);
        }}
        else{return 0;}
    }
    
}
//retoune le jour de l'operation
function Today(){
    let date=new Date();
    date.setDate(date.getDate());
    let day=date.getDate();
    let month=date.getMonth()+1;
    let year=date.getFullYear();
    let today=month+"/"+day+"/"+year;
    return today
}
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', async function () {
  console.log('Connected to the database');

    
    
    try {
        app.post("/bank",function(req,res){
            var nbJoursBanque=Number(req.body.nbjours);
            var dateTaux=req.body.moisTaux
            var taux=Number(req.body.taux)
            var taxImpot=Number(req.body.impot)
            var enregistrementBanque= new Banque({
                date:dateTaux,
                taux:taux,
                jrbanque:nbJoursBanque,
                impot:taxImpot
            })
            enregistrementBanque.save()
            res.redirect("/bank");
        })
        app.post("/admin",function(req,res){
            var input=Number(req.body.operation);
            var taux=1;
            var nbJoursBanque=7;
            var impot=20;
            
            if (input>=0){
                Operation.find().sort( { dateValeur: 1 } ).then((data) => {
                    var s=Solde(data,Credit(nbJoursBanque));
                    Banque.find().then((bankData) => {
                        //doit tester sur le mois
                        if (bankData[0].jrbanque!=7){nbJoursBanque=bankData[0].jrbanque;};
                        for (var i=0;i<bankData.length;i++){
                            console.log(bankData[i].date.getMonth(),Credit(nbJoursBanque).getMonth(),bankData[i].date.getMonth()==Credit(nbJoursBanque).getMonth())
                            if (bankData[i].date.getMonth()==Credit(nbJoursBanque).getMonth()){
                                taux=bankData[i].taux;
                                nbJoursBanque=bankData[i].jrbanque;
                                impot=bankData[i].impot;
                                console.log("apres fitching de banques le taux est : ",taux);
                                break
                            }
                        }
                        if (s+input>=0){
                            console.log("le taux est : ",taux)
                            var enregistrementObjet=new Operation({
                                dateOperation:Today(),
                                dateValeur:Credit(nbJoursBanque),
                                operationDebit:0,
                                operationCredit:input,
                                nombreJour:NombreJour(data,Credit(nbJoursBanque)),
                                taux:taux,
                                interet:NombreJour(data,Credit(nbJoursBanque))*taux*(s+input)/36000,
                                solde:s+input
                            });
                            enregistrementObjet.save();
                            test=false;
                        }
                        else{
                            test=true;
                        }
                    })
                    //place de s+input >=0...
                    
                })
                
                }
            else{
                
                Operation.find().sort( { dateValeur: 1 } ).then((data) => {
                    var s=Solde(data,Debit(nbJoursBanque));
                    Banque.find().then((bankData) => {
                        if (bankData[0].jrbanque!=7){nbJoursBanque=bankData[0].jrbanque;};
                        for (var i=0;i<bankData.length;i++){
                            if (bankData[i].date.getMonth()==Debit(nbJoursBanque).getMonth()){
                                taux=bankData[i].taux;
                                nbJoursBanque=bankData[i].jrbanque;
                                impot=bankData[i].impot;
                                break
                            }
                        }
                        if (s+input>=0){
                            var enregistrementObjet=new Operation({
                                dateOperation:Today(),
                                dateValeur:Debit(nbJoursBanque),
                                operationDebit:input,
                                operationCredit:0,
                                nombreJour:NombreJour(data,Debit(nbJoursBanque)),
                                taux:taux,
                                interet:NombreJour(data,Debit(nbJoursBanque))*taux*(s+input)/36000,
                                solde:s+input
                                
                            });
                            enregistrementObjet.save();
                            test=false;
                        }
                        else{test=true;}
                    })
                    //place de s+input>=0...
                    
                })
            }
            res.redirect("/admin");
        });
        
        
        
        
        
        app.get('/admin',function(req,res){
            Operation.find().sort( { dateValeur: 1 } ).then((data) => {
                res.render("admin",{list:data,testing:test,Mon:months})
            })
            
            
        });
        
        app.get('/bank',function(req,res){
            Banque.find().then((data) => {
            res.render("bank",{
                list:data,
                Mon:months
                //taux
                //les mois
                //tax
                //interet brut
                //jour de banque
            })
            })
            
        });
        
    } catch (err) {
        console.error(err);
    }
});


app.listen(process.env.PORT || 3004, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });