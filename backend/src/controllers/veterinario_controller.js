import {sendMailToRegister, sendMailToRecoveryPassword } from "../config/nodemailer.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import Veterinario from "../models/Veterinario.js"


const registro = async (req,res) => {
    // 1
    const {email,password} = req.body
    // 2
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Todos los campos son obligatorios"})
    const veterinarioEmailBDD = await Veterinario.findOne({email})
    if (veterinarioEmailBDD) return res.status(400).json({msg:"El email ya está registrado"})
    // 3
    const nuevoVeterinario = new Veterinario(req.body)
    nuevoVeterinario.password = await nuevoVeterinario.encrypPassword(password)
    const token = nuevoVeterinario.crearToken()
    await sendMailToRegister(email,token)
    await nuevoVeterinario.save()
    // 4
    res.status(200).json({msg:"Revisa su correo electrónico para confirmar su cuenta"})  
}


const confirmarMail = async (req,res)=>{
    // 1
    const {token} = req.params
    // 2
    const veterinarioBDD = await Veterinario.findOne({token})
    if(!veterinarioBDD?.token) return res.status(404).json({msg:"La cuenta ya ha sido confirmada"})
    // 3
    veterinarioBDD.token = null
    veterinarioBDD.confirmEmail=true
    await veterinarioBDD.save()
    // 4
    res.status(200).json({msg:"Token confirmado, ya puedes iniciar sesión"}) 
}

// Etapa 1
const recuperarPassword = async(req,res) => {
    // 1
    const {email}= req.body
    // 2 
    if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})
    
    const veterinaarioBDD = await Veterinario.findOne({email})
    if (!veterinaarioBDD) return res.status(404).json({msg:"Lo sentimos, el uusario no existe"})

    // 3
    const token = veterinaarioBDD.crearToken()
    veterinaarioBDD.token = token
    await sendMailToRecoveryPassword(email,token)
    await veterinaarioBDD.save()
    
    // 4
    res.status(200).json({msg:"Revisa tu correo para restablecer tu contraseña"})
}

// Etapa 2 
const comprobarTokenPassword = async (req,res) => { 
    // 1
    const {token} = req.params
    // 2
    const veterinaarioBDD = await Veterinario.findOne({token})
    if(veterinaarioBDD.token !== token) return res.status(404).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    // 3
    await veterinaarioBDD.save()
    // 4
    res.status(200).json({msg:"Token confirmaado, ya puedes crear tu nuevo password"})
}




// Etapa 3
const crearNuevoPasssword = async (req,res) => { 
    // 1
    const {password,confirmpassword}=req.body
    // 2
    if(Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})
    
    if (password !== confirmpassword) return res.status(404).json({msg:"Lo sentimos, los password no coinciden"})

    const veterinaarioBDD = await Veterinario.findOne({token:req.params.token})

    if(veterinaarioBDD.token !== req.params.token) return res.status(404).json({msg:"Lo sentimos, no se puede vaalidar la cuenta"})

    // 3
    veterinaarioBDD.token = null
    veterinaarioBDD.password = await veterinaarioBDD.encrypPassword(password)
    await veterinaarioBDD.save()

    // 4
    res.status(200).json({msg:"Felciitaciones, ya puedes inciar sesión con tu nuevo password"})
}


const login = async(req,res) => {
    //! -----> 1
    const {email,password}=req.body
    //! -----> 2
    if(Object.values(req.body).includes("")) return res.status(400).json({msg:"Todos los campos son obligatorios"})

    const veterinarioBDD = await Veterinario.findOne({email}).select("-status -__v -token -createdAt -updatedAt")

    if (veterinarioBDD?.confirmEmail===false) return res.status(401).json({msg:"Lo sentimos, debes confirmar tu cuenta antes de iniciar sesión"})

    if(!veterinarioBDD) return res.status(404).json({msg:"Lo sentimos, el usuario no existe"})

    const verificarPassword = await veterinarioBDD.matchPassword(password)

    if (!verificarPassword) return res.status(401).json({msg:"Lo sentimos, el password es incorrecto"})

    //! -----> 3
    const{nombre,apellido,direccion,telefono,_id,rol}=veterinarioBDD

    const token = crearTokenJWT(veterinarioBDD._id,veterinarioBDD.rol)

    //! -----> 4
    res.status(200).json({
        token,
        rol,
        nombre,
        apellido,
        direccion,
        telefono,
        _id,
    })
}

const perfil = (req,res) => {
    const {token,confirmEmail,createdAt,updatedAt,__v,...datosPerfil} = req.veterinarioBDD
    res.status(200).json(datosPerfil)

}



export {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevoPasssword,
    login,
    perfil
}


