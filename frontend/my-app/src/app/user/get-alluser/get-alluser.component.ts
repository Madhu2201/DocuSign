import { Component } from '@angular/core';
import { AuthService } from '../../Service/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-get-alluser',
  imports: [CommonModule, FormsModule],
  templateUrl: './get-alluser.component.html',
  styleUrl: './get-alluser.component.css'
})
export class GetAlluserComponent {
// users: any[] = [];

//   constructor(private auth: AuthService) {}

//   ngOnInit() {
//     this.auth.getAllUsers().subscribe({
//       next: (data: any) => this.users = data,
//       error: (err) => alert('Access denied or error')
//     });
//   }
}
