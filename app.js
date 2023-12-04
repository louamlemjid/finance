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
function NombreJour(){
    //let d1=new Date(this.dateValeur);
    //if(list.Afficher().length==0 || list.Afficher().indexOf(this)==0 ){var d2=new Date(this.ouvertureCompte)}
    //if(list.Afficher().length==1){var d2=new Date(list.Afficher()[0].dateValeur)}
    //if(list.Afficher().indexOf(this)!=0){console.log(list.Afficher().indexOf(this)-1)
    //    var d2=new Date(list.Afficher()[list.Afficher().indexOf(this)-1].dateValeur)}
    //
    //return (d1.getTime()-d2.getTime())/(1000*3600 * 24);
    return 10
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
        app.post("/",function(req,res){
            var input=Number(req.body.operation);
            var taux=Number(req.body.taux);
            var nbJoursBanque=Number(req.body.nbjours)
            
            
            if (input>=0){
                Operation.find().sort( { dateValeur: 1 } ).then((data) => {
                    var s=Solde(data,Credit(nbJoursBanque));
                    //Operation.updateOne({ operationDebit : 0 },{ $set: { solde : s }});
                    if (s+input>=0){
                        var enregistrementObjet=new Operation({
                            dateOperation:Today(),
                            dateValeur:Credit(nbJoursBanque),
                            operationDebit:0,
                            operationCredit:input,
                            nombreJour:NombreJour(),
                            taux:taux,
                            interet:0,
                            solde:s+input
                        });
                        enregistrementObjet.save();
                        test=false;
                    }
                    else{
                        test=true;
                    }
                })
                
                }
            else{
                Operation.find().sort( { dateValeur: 1 } ).then((data) => {
                    var s=Solde(data,Debit(nbJoursBanque));
                    //Operation.updateOne({ operationDebit : 0 },{ $set: { solde : s }});
                    if (s+input>=0){
                        var enregistrementObjet=new Operation({
                            dateOperation:Today(),
                            dateValeur:Debit(nbJoursBanque),
                            operationDebit:input,
                            operationCredit:0,
                            nombreJour:NombreJour(),
                            taux:taux,
                            interet:0,
                            solde:s+input
                            
                        });
                        enregistrementObjet.save();
                        test=false;
                    }
                    else{test=true;}
                })
            }
            res.redirect("/");
        });
        
        
        
        
        
        app.get('/',function(req,res){
            Operation.find().sort( { dateValeur: 1 } ).then((data) => {
                res.render("admin",{list:data,testing:test,Mon:months})
            })
            
            
        });
        
        //app.get('/admin',function(req,res){
        //    Fruit.find().then((data) => {
        //    console.log(data);
        //    res.render("admin",{dos:data})
        //    })
        //    
        //});
        
    } catch (err) {
        console.error(err);
    }
});


app.listen(process.env.PORT || 3004, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
