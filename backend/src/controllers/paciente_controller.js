import { sendMailToOwner } from "../config/nodemailer.js"
import Paciente from "../models/Paciente.js"
import { v2 as cloudinary } from 'cloudinary'
import fs from "fs-extra"
import mongoose from "mongoose"
import { crearTokenJWT } from "../middlewares/JWT.js"
import Tratamiento from "../models/Tratamiento.js"


const registrarPaciente = async(req,res) => {
    //   -------------------  1
    const {emailPropietario} = req.body

    //   -------------------  2
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})

    const verificarEmailBDD = await Paciente.findOne({emailPropietario})
    if(verificarEmailBDD) return res.status(400).json({msg:"Lo sentimos, el email ya se encuentra registrado"})

    //   -------------------  3
    const password = Math.random().toString(36).toUpperCase().slice(2, 5)

    const nuevoPaciente = new Paciente({
        ...req.body,
	passwordPropietario: await Paciente.prototype.encrypPassword("VET"+password),
        veterinario: req.veterinarioBDD._id
    })

    if(req.files?.imagen){
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.imagen.tempFilePath,{folder:'Pacientes'})
        nuevoPaciente.avatarMascota = secure_url
        nuevoPaciente.avatarMascotaID = public_id
        await fs.unlink(req.files.imagen.tempFilePath)
    }


        if (req.body?.avatarMascotaIA) {
    // data:image/png;base64,iVBORw0KGgjbjgfyvh
    // iVBORw0KGgjbjgfyvh
    const base64Data = req.body.avatarMascotaIA.replace(/^data:image\/\w+;base64,/, '')
    // iVBORw0KGgjbjgfyvh  -  010101010101010101
    const buffer = Buffer.from(base64Data, 'base64')
    const { secure_url } = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'Pacientes', resource_type: 'auto' }, (error, response) => {
            if (error) {
                reject(error)
            } else {
                resolve(response)
            }
        })
        stream.end(buffer)
    })
        nuevoPaciente.avatarMascotaIA = secure_url
    }
    
    
    await nuevoPaciente.save()

    await sendMailToOwner(emailPropietario,"VET"+password) // VET4FEE

    //   -------------------  4
    res.status(201).json({msg:"Registro exitoso de la mascota y correo enviado al propietario"})
}



const listarPacientes = async (req,res)=>{
    if (req.pacienteBDD?.rol ==="paciente"){
        const pacientes = await Paciente.find(req.pacienteBDD._id).select("-salida -createdAt -updatedAt -__v").populate('veterinario','_id nombre apellido')
        res.status(200).json(pacientes)
    }
    else{
        const pacientes = await Paciente.find({estadoMascota:true}).where('veterinario').equals(req.veterinarioBDD).select("-salida -createdAt -updatedAt -__v").populate('veterinario','_id nombre apellido')
        res.status(200).json(pacientes)
    }
}

const detallePaciente = async(req,res)=>{
    const {id} = req.params
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el veterinario ${id}`});
    const paciente = await Paciente.findById(id).select("-createdAt -updatedAt -__v").populate('veterinario','_id nombre apellido')
    const tratamientos = await Tratamiento.find().where('paciente').equals(id)
    res.status(200).json({
        paciente,
        tratamientos
    })
}


const eliminarPaciente = async (req,res)=>{
    const {id} = req.params
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el veterinario ${id}`})
    const {salidaMascota} = req.body
    await Paciente.findByIdAndUpdate(req.params.id,{salidaMascota:Date.parse(salidaMascota),estadoMascota:false})
    res.status(200).json({msg:"Fecha de salida de la mascota registrado exitosamente"})
}



const actualizarPaciente = async(req,res)=>{
    const {id} = req.params
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el veterinario ${id}`})
    if (req.files?.imagen) {
        const paciente = await Paciente.findById(id)
        if (paciente.avatarMascotaID) {
            await cloudinary.uploader.destroy(paciente.avatarMascotaID);
        }
        const cloudiResponse = await cloudinary.uploader.upload(req.files.imagen.tempFilePath, { folder: 'Pacientes' });
        req.body.avatarMascota = cloudiResponse.secure_url;
        req.body.avatarMascotaID = cloudiResponse.public_id;
        await fs.unlink(req.files.imagen.tempFilePath);
    }
    await Paciente.findByIdAndUpdate(id, req.body, { new: true })
    res.status(200).json({msg:"Actualización exitosa del paciente"})
}



const loginPropietario = async(req,res)=>{
    const {email:emailPropietario,password:passwordPropietario} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})
    const pacienteBDD = await Paciente.findOne({emailPropietario})
    if(!pacienteBDD) return res.status(404).json({msg:"Lo sentimos, el usuario no se encuentra registrado"})
    const verificarPassword = await pacienteBDD.matchPassword(passwordPropietario)
    if(!verificarPassword) return res.status(404).json({msg:"Lo sentimos, el password no es el correcto"})
    const token = crearTokenJWT(pacienteBDD._id,pacienteBDD.rol)
	const {_id,rol} = pacienteBDD
    res.status(200).json({
        token,
        rol,
        _id
    })
}


const perfilPropietario = (req, res) => {
    
    const camposAEliminar = [
        "fechaIngresoMascota", "sintomasMascota", "salidaMascota",
        "estadoMascota", "veterinario", "tipoMascota",
        "fechaNacimientoMascota", "passwordPropietario", 
        "avatarMascota", "avatarMascotaIA","avatarMascotaID", "createdAt", "updatedAt", "__v"
    ]

    camposAEliminar.forEach(campo => delete req.pacienteBDD[campo])

    res.status(200).json(req.pacienteBDD)
}




export{
    registrarPaciente,
    listarPacientes,
    detallePaciente,
    eliminarPaciente,
    actualizarPaciente,
    loginPropietario,
    perfilPropietario
}