import {Router} from 'express'
import { comprobarTokenPassword, confirmarMail, crearNuevoPasssword, login, perfil, recuperarPassword, registro } from '../controllers/veterinario_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
const router = Router()


router.post('/registro',registro)
router.get('/confirmar/:token',confirmarMail)


router.post('/recuperarpassword',recuperarPassword)
router.get('/recuperarpassword/:token',comprobarTokenPassword)
router.post('/nuevopassword/:token',crearNuevoPasssword)


router.post('/login',login)


router.get('/perfil',verificarTokenJWT,perfil)


export default router


